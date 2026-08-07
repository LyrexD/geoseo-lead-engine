import type { Prospect } from '../src/types';
import {
  auditWebsite,
  createMissingWebsiteAnalysis,
  createUnavailableWebsiteAnalysis,
  resolveIndustryProfile,
} from './audit';
import type {
  AuditAnalysis,
  DiscoveryRequest,
  DiscoveryResult,
  OsmElement,
  OsmResponse,
} from './domain';
import { fetchLimited } from './network';
import {
  errorMessage,
  escapeOverpass,
  escapeRegExp,
  formatAddress,
  normalizeText,
  normalizeWebsite,
  stableId,
} from './utils';

interface CachedDiscovery {
  expiresAt: number;
  prospects: Prospect[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

const discoveryCache = new Map<string, CachedDiscovery>();
const locationCenterCache = new Map<
  string,
  { expiresAt: number; coordinates: Coordinates }
>();
const KNOWN_TURKISH_CITY_CENTERS: Record<string, Coordinates> = {
  adana: { lat: 37.0000, lng: 35.3213 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  antalya: { lat: 36.8969, lng: 30.7133 },
  aydin: { lat: 37.8450, lng: 27.8396 },
  balikesir: { lat: 39.6484, lng: 27.8826 },
  bursa: { lat: 40.1885, lng: 29.0610 },
  denizli: { lat: 37.7765, lng: 29.0864 },
  diyarbakir: { lat: 37.9144, lng: 40.2306 },
  edirne: { lat: 41.6771, lng: 26.5557 },
  erzurum: { lat: 39.9043, lng: 41.2679 },
  eskisehir: { lat: 39.7767, lng: 30.5206 },
  gaziantep: { lat: 37.0662, lng: 37.3833 },
  hatay: { lat: 36.2021, lng: 36.1600 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  kayseri: { lat: 38.7205, lng: 35.4826 },
  kocaeli: { lat: 40.7654, lng: 29.9408 },
  konya: { lat: 37.8746, lng: 32.4932 },
  malatya: { lat: 38.3552, lng: 38.3095 },
  manisa: { lat: 38.6191, lng: 27.4289 },
  mersin: { lat: 36.8121, lng: 34.6415 },
  mugla: { lat: 37.2153, lng: 28.3636 },
  sakarya: { lat: 40.7731, lng: 30.3948 },
  samsun: { lat: 41.2867, lng: 36.3300 },
  sanliurfa: { lat: 37.1674, lng: 38.7955 },
  tekirdag: { lat: 40.9781, lng: 27.5117 },
  trabzon: { lat: 41.0027, lng: 39.7168 },
  van: { lat: 38.5012, lng: 43.3729 },
};
const KNOWN_TURKISH_DISTRICT_CENTERS: Record<string, Coordinates> = {
  'balcova|izmir': { lat: 38.3940, lng: 27.0500 },
  'bayrakli|izmir': { lat: 38.4622, lng: 27.1667 },
  'bornova|izmir': { lat: 38.4622, lng: 27.2167 },
  'buca|izmir': { lat: 38.3871, lng: 27.1792 },
  'gaziemir|izmir': { lat: 38.3239, lng: 27.1292 },
  'karabaglar|izmir': { lat: 38.3697, lng: 27.1300 },
  'karsiyaka|izmir': { lat: 38.4550, lng: 27.1100 },
  'konak|izmir': { lat: 38.4189, lng: 27.1287 },
};
const endpointCooldowns = new Map<string, number>();
let overpassQueue: Promise<void> = Promise.resolve();
let lastOverpassRequestAt = 0;

function parseLocation(location: string): {
  district: string;
  city: string;
} {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts.at(-1) || '';
    const firstIsKnownCity = Boolean(
      KNOWN_TURKISH_CITY_CENTERS[normalizeText(first)],
    );
    const lastIsKnownCity = Boolean(
      KNOWN_TURKISH_CITY_CENTERS[normalizeText(last)],
    );
    if (firstIsKnownCity && !lastIsKnownCity) {
      return {
        district: parts.slice(1).join(', '),
        city: first,
      };
    }
    return {
      district: parts.slice(0, -1).join(', '),
      city: last,
    };
  }
  return { district: '', city: parts[0] || '' };
}

function locationStatements(
  location: string,
  useDistrict: boolean,
  center?: Coordinates,
): {
  prefix: string;
  spatialFilter: string;
} {
  const { district } = parseLocation(location);
  const safeDistrict = escapeOverpass(district);

  if (useDistrict && district) {
    return {
      prefix: `
(
  area["boundary"="administrative"]["name"="${safeDistrict}"];
  area["boundary"="administrative"]["name:tr"="${safeDistrict}"];
  area["boundary"="administrative"]["name:en"="${safeDistrict}"];
)->.searchArea;`,
      spatialFilter: 'area.searchArea',
    };
  }

  if (!center) {
    throw new Error('Şehir merkezi koordinatı çözümlenmeden sorgu oluşturulamaz.');
  }

  const radiusKm = parseLocation(location).district ? 4 : 8;
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta =
    radiusKm / (111.32 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  const south = (center.lat - latitudeDelta).toFixed(6);
  const west = (center.lng - longitudeDelta).toFixed(6);
  const north = (center.lat + latitudeDelta).toFixed(6);
  const east = (center.lng + longitudeDelta).toFixed(6);

  return {
    prefix: '',
    spatialFilter: `${south},${west},${north},${east}`,
  };
}

export function buildLocationCenterQuery(location: string): string {
  const { district, city } = parseLocation(location);
  const target = escapeOverpass(district || city);
  return `[out:json][timeout:8];
(
  node["place"~"^(city|town|borough|suburb)$"]["name"="${target}"];
  node["place"~"^(city|town|borough|suburb)$"]["name:tr"="${target}"];
  node["place"~"^(city|town|borough|suburb)$"]["name:en"="${target}"];
);
out body qt 10;`;
}

export function buildOverpassQuery(
  request: DiscoveryRequest,
  useDistrict = true,
  center?: Coordinates,
): string {
  const profile = resolveIndustryProfile(request.industry);
  const { prefix, spatialFilter } = locationStatements(
    request.location,
    useDistrict,
    center,
  );
  const resultLimit = Math.min(100, Math.max(request.limit * 4, 30));

  const tagSelectors = profile.selectors.map(([key, value]) =>
    value
      ? `nwr(${spatialFilter})["${escapeOverpass(key)}"="${escapeOverpass(value)}"]["name"];`
      : `nwr(${spatialFilter})["${escapeOverpass(key)}"]["name"];`,
  );
  const searchPattern = profile.aliases.length
    ? profile.aliases.map(escapeRegExp).join('|')
    : escapeRegExp(request.industry);
  const textSelectors = [
    `nwr(${spatialFilter})["name"~"${escapeOverpass(searchPattern)}",i];`,
    `nwr(${spatialFilter})["description"~"${escapeOverpass(searchPattern)}",i]["name"];`,
  ];
  const selectors = [...tagSelectors, ...textSelectors].join('\n');

  return `[out:json][timeout:14];
${prefix}
(
${selectors}
);
out center tags qt ${resultLimit};`;
}

async function waitForOverpassSlot(): Promise<void> {
  let release!: () => void;
  const previous = overpassQueue;
  overpassQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  const delay = Math.max(0, 1_200 - (Date.now() - lastOverpassRequestAt));
  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastOverpassRequestAt = Date.now();
  release();
}

async function requestOverpass(query: string): Promise<OsmResponse> {
  const configuredEndpoints =
    process.env.OVERPASS_API_URLS || process.env.OVERPASS_API_URL;
  const endpoints = configuredEndpoints
    ? configuredEndpoints.split(',').map((value) => value.trim()).filter(Boolean)
    : [
        'https://overpass-api.de/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
      ];
  const contact = (process.env.ADMIN_CONTACT_EMAIL || '').trim();
  const userAgent = contact
    ? `GeoSEOLeadEngine/2.0 (${contact})`
    : 'GeoSEOLeadEngine/2.0 (local-business-discovery)';
  const failures: string[] = [];

  const now = Date.now();
  const healthyEndpoints = endpoints.filter(
    (endpoint) => (endpointCooldowns.get(endpoint) || 0) <= now,
  );
  const candidates = healthyEndpoints.length ? healthyEndpoints : endpoints;

  for (const endpoint of candidates) {
    try {
      await waitForOverpassSlot();
      const response = await fetchLimited(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        timeoutMs: 16_000,
        maxBytes: 8_000_000,
        validatePublicAddress: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': userAgent,
        },
      });
      if (!response.ok) {
        failures.push(`${new URL(endpoint).hostname}: HTTP ${response.status}`);
        if (response.status === 429 || response.status >= 500) {
          endpointCooldowns.set(endpoint, Date.now() + 2 * 60_000);
        }
        continue;
      }
      endpointCooldowns.delete(endpoint);
      return JSON.parse(response.body) as OsmResponse;
    } catch (error) {
      failures.push(`${new URL(endpoint).hostname}: ${errorMessage(error)}`);
      endpointCooldowns.set(endpoint, Date.now() + 2 * 60_000);
    }
  }

  throw new Error(
    `İşletme veri kaynaklarına ulaşılamadı. ${failures.join(' | ')}`,
  );
}

async function resolveLocationCenter(location: string): Promise<Coordinates> {
  const cacheKey = normalizeText(location);
  const cached = locationCenterCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.coordinates;
  }

  const { district, city } = parseLocation(location);
  const target = normalizeText(district || city);
  const knownLocation = district
    ? KNOWN_TURKISH_DISTRICT_CENTERS[
        `${normalizeText(district)}|${normalizeText(city)}`
      ]
    : KNOWN_TURKISH_CITY_CENTERS[normalizeText(city)];
  if (knownLocation) {
    locationCenterCache.set(cacheKey, {
      expiresAt: Date.now() + 24 * 60 * 60_000,
      coordinates: knownLocation,
    });
    return knownLocation;
  }

  const response = await requestOverpass(buildLocationCenterQuery(location));
  const candidates = (response.elements || [])
    .filter((element) => elementCoordinates(element))
    .sort((left, right) => {
      const leftName = normalizeText(left.tags?.name || '');
      const rightName = normalizeText(right.tags?.name || '');
      const leftExact = leftName === target ? 1 : 0;
      const rightExact = rightName === target ? 1 : 0;
      const leftCity = left.tags?.place === 'city' ? 1 : 0;
      const rightCity = right.tags?.place === 'city' ? 1 : 0;
      return rightExact - leftExact || rightCity - leftCity;
    });
  const coordinates = candidates[0] && elementCoordinates(candidates[0]);
  if (!coordinates) {
    throw new Error(
      `"${district || city}" için OpenStreetMap şehir/ilçe merkezi bulunamadı.`,
    );
  }
  locationCenterCache.set(cacheKey, {
    expiresAt: Date.now() + 24 * 60 * 60_000,
    coordinates,
  });
  return coordinates;
}

function readContact(tags: Record<string, string>, name: string): string {
  return tags[`contact:${name}`] || tags[name] || '';
}

function profileCompleteness(tags: Record<string, string>): number {
  const evidence = [
    Boolean(tags.name),
    Boolean(readContact(tags, 'phone')),
    Boolean(readContact(tags, 'website') || tags.url),
    Boolean(tags['addr:street'] || tags['addr:full']),
  ];
  return Math.round(
    (evidence.filter(Boolean).length / evidence.length) * 100,
  );
}

function websiteFromTags(tags: Record<string, string>): string {
  const raw = readContact(tags, 'website') || tags.url || '';
  if (!raw) return '';
  try {
    return normalizeWebsite(raw);
  } catch {
    return '';
  }
}

function elementCoordinates(element: OsmElement): { lat: number; lng: number } | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat: lat as number, lng: lng as number };
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let next = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (next < values.length) {
        const index = next;
        next += 1;
        results[index] = await worker(values[index], index);
      }
    },
  );
  await Promise.all(runners);
  return results;
}

function candidateKey(element: OsmElement): string {
  return `${element.type}/${element.id}`;
}

function isUsefulElement(element: OsmElement): boolean {
  const tags = element.tags || {};
  return Boolean(tags.name && elementCoordinates(element));
}

async function elementToProspect(
  element: OsmElement,
  request: DiscoveryRequest,
): Promise<Prospect> {
  const tags = element.tags || {};
  const coordinates = elementCoordinates(element);
  if (!coordinates) throw new Error('İşletmenin koordinatı bulunamadı.');
  const profile = resolveIndustryProfile(request.industry);
  const { district: queryDistrict, city: queryCity } = parseLocation(request.location);
  const district =
    tags['addr:district'] ||
    tags['addr:suburb'] ||
    tags['addr:neighbourhood'] ||
    queryDistrict ||
    queryCity;
  const city = tags['addr:city'] || queryCity || request.location;
  const phone = readContact(tags, 'phone') || readContact(tags, 'mobile');
  const email = readContact(tags, 'email');
  const websiteUrl = websiteFromTags(tags);
  const sourceId = candidateKey(element);
  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
  const context = {
    businessName: tags.name,
    industry: profile.label,
    city,
    district,
    phone,
    address: formatAddress(tags, `${district}, ${city}`),
    map: {
      exists: true,
      categoryMatched: true,
      profileCompleteness: profileCompleteness(tags),
    },
  };

  let analysis: AuditAnalysis;
  if (!websiteUrl) {
    analysis = createMissingWebsiteAnalysis(context);
  } else {
    try {
      analysis = (await auditWebsite(websiteUrl, context)).analysis;
    } catch (error) {
      analysis = createUnavailableWebsiteAnalysis(
        websiteUrl,
        context,
        errorMessage(error),
      );
    }
  }

  const now = new Date().toISOString();
  return {
    id: stableId('openstreetmap', sourceId),
    businessName: tags.name.trim(),
    industry: profile.label,
    city,
    district,
    address: context.address,
    phone,
    email,
    websiteUrl,
    mapsUrl: sourceUrl,
    lat: coordinates.lat,
    lng: coordinates.lng,
    primaryOpportunity: analysis.primaryOpportunity,
    secondaryOpportunities: analysis.secondaryOpportunities,
    status: 'new',
    audit: analysis.audit,
    notes: [],
    createdAt: now,
    updatedAt: now,
    estimatedContractValue: analysis.estimatedContractValue,
    discovery: {
      provider: 'openstreetmap',
      sourceId,
      sourceUrl,
      discoveredAt: now,
      potentialScore: analysis.potentialScore,
      reasons: analysis.reasons,
      attribution: '© OpenStreetMap katkıcıları',
    },
  };
}

export async function discoverProspects(
  input: Partial<DiscoveryRequest>,
  existingProspects: Prospect[] = [],
): Promise<DiscoveryResult> {
  const location = String(input.location || '').trim();
  const industry = String(input.industry || '').trim();
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  if (location.length < 2 || location.length > 100) {
    throw new Error('Konum 2-100 karakter arasında olmalıdır.');
  }
  if (industry.length < 2 || industry.length > 80) {
    throw new Error('Sektör 2-80 karakter arasında olmalıdır.');
  }

  const request: DiscoveryRequest = { location, industry, limit };
  const cacheKey = `${normalizeText(location)}|${normalizeText(industry)}|${limit}`;
  const analyzedProspectIds = new Set(
    existingProspects
      .filter((prospect) => prospect.status !== 'new')
      .map((prospect) => prospect.id),
  );
  const analyzedSourceIds = new Set(
    existingProspects
      .filter(
        (prospect) =>
          prospect.status !== 'new' &&
          prospect.discovery?.provider === 'openstreetmap' &&
          prospect.discovery.sourceId,
      )
      .map((prospect) => prospect.discovery!.sourceId!),
  );
  const wasAnalyzed = (prospect: Prospect) =>
    analyzedProspectIds.has(prospect.id) ||
    Boolean(
      prospect.discovery?.provider === 'openstreetmap' &&
        prospect.discovery.sourceId &&
        analyzedSourceIds.has(prospect.discovery.sourceId),
    );
  const cached = discoveryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const skippedAnalyzed = cached.prospects.filter(wasAnalyzed).length;
    if (skippedAnalyzed === 0) {
      return {
        prospects: cached.prospects,
        summary: {
          provider: 'openstreetmap',
          location,
          industry,
          examined: cached.prospects.length,
          added: 0,
          updated: 0,
          skipped: 0,
          skippedAnalyzed: 0,
          cached: true,
        },
      };
    }
  }

  const hasDistrict = Boolean(parseLocation(location).district);
  let response: OsmResponse;
  if (hasDistrict) {
    const parsed = parseLocation(location);
    const knownDistrict =
      KNOWN_TURKISH_DISTRICT_CENTERS[
        `${normalizeText(parsed.district)}|${normalizeText(parsed.city)}`
      ];
    if (knownDistrict) {
      response = await requestOverpass(
        buildOverpassQuery(request, false, knownDistrict),
      );
    } else {
      try {
        response = await requestOverpass(buildOverpassQuery(request, true));
      } catch {
        const center = await resolveLocationCenter(location);
        response = await requestOverpass(
          buildOverpassQuery(request, false, center),
        );
      }
    }
    if (!response.elements || response.elements.length === 0) {
      const center = await resolveLocationCenter(location);
      response = await requestOverpass(
        buildOverpassQuery(request, false, center),
      );
    }
  } else {
    const center = await resolveLocationCenter(location);
    response = await requestOverpass(buildOverpassQuery(request, false, center));
  }

  const seen = new Set<string>();
  const elements = (response.elements || [])
    .filter(isUsefulElement)
    .filter((element) => {
      const key = candidateKey(element);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  let skippedAnalyzed = 0;
  const eligibleElements = elements.filter((element) => {
    const sourceId = candidateKey(element);
    const prospectId = stableId('openstreetmap', sourceId);
    const analyzed =
      analyzedProspectIds.has(prospectId) || analyzedSourceIds.has(sourceId);
    if (analyzed) skippedAnalyzed += 1;
    return !analyzed;
  });
  const selected = eligibleElements.slice(0, limit);
  const prospects = await mapConcurrent(selected, 3, (element) =>
    elementToProspect(element, request),
  );
  prospects.sort(
    (a, b) =>
      (b.discovery?.potentialScore ?? 0) - (a.discovery?.potentialScore ?? 0),
  );

  const ttlMinutes = Math.max(
    5,
    Number(process.env.DISCOVERY_CACHE_TTL_MINUTES) || 30,
  );
  discoveryCache.set(cacheKey, {
    expiresAt: Date.now() + ttlMinutes * 60_000,
    prospects,
  });

  return {
    prospects,
    summary: {
      provider: 'openstreetmap',
      location,
      industry,
      examined: elements.length,
      added: prospects.length,
      updated: 0,
      skipped: Math.max(0, elements.length - prospects.length),
      skippedAnalyzed,
      cached: false,
    },
  };
}
