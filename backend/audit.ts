import type { AiSearchVisibilityGrade, OpportunityType } from '../src/types';
import type {
  AuditAnalysis,
  AuditContext,
  IndustryProfile,
  MapEvidence,
  WebsiteEvidence,
} from './domain';
import { fetchLimited } from './network';
import {
  clamp,
  decodeHtml,
  normalizeText,
  rounded,
  stripTags,
} from './utils';

const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: 'dentist',
    label: 'Diş Hekimi / Diş Kliniği',
    aliases: ['diş hekimi', 'diş kliniği', 'dis hekimi', 'dis klinigi', 'dentist', 'dental', 'implant'],
    selectors: [['amenity', 'dentist']],
    baseContractValue: 45_000,
    monthlyDigitalOpportunity: 180_000,
  },
  {
    id: 'hair_transplant',
    label: 'Saç Ekimi / Medikal Estetik',
    aliases: ['saç ekimi', 'sac ekimi', 'hair transplant'],
    selectors: [
      ['healthcare:speciality', 'plastic_surgery'],
      ['healthcare:speciality', 'dermatology'],
    ],
    baseContractValue: 70_000,
    monthlyDigitalOpportunity: 320_000,
  },
  {
    id: 'aesthetic_clinic',
    label: 'Estetik / Plastik Cerrahi Kliniği',
    aliases: ['estetik', 'plastik cerrahi', 'plastic surgery', 'medikal estetik'],
    selectors: [
      ['healthcare:speciality', 'plastic_surgery'],
      ['healthcare:speciality', 'dermatology'],
    ],
    baseContractValue: 72_000,
    monthlyDigitalOpportunity: 340_000,
  },
  {
    id: 'eye_clinic',
    label: 'Göz Kliniği / Göz Hastanesi',
    aliases: ['göz kliniği', 'goz klinigi', 'göz hastanesi', 'goz hastanesi', 'oftalmoloji', 'ophthalmology'],
    selectors: [
      ['healthcare:speciality', 'ophthalmology'],
      ['shop', 'optician'],
    ],
    baseContractValue: 62_000,
    monthlyDigitalOpportunity: 260_000,
  },
  {
    id: 'fertility_clinic',
    label: 'Tüp Bebek / Kadın Doğum Kliniği',
    aliases: ['tüp bebek', 'tup bebek', 'kadın doğum', 'kadin dogum', 'jinekoloji', 'fertility'],
    selectors: [['healthcare:speciality', 'gynaecology']],
    baseContractValue: 68_000,
    monthlyDigitalOpportunity: 310_000,
  },
  {
    id: 'healthcare',
    label: 'Özel Hastane / Tıp Merkezi',
    aliases: ['özel hastane', 'ozel hastane', 'tıp merkezi', 'tip merkezi', 'poliklinik', 'medical center'],
    selectors: [
      ['amenity', 'hospital'],
      ['amenity', 'clinic'],
      ['amenity', 'doctors'],
      ['healthcare', 'clinic'],
      ['healthcare', 'doctor'],
    ],
    baseContractValue: 74_000,
    monthlyDigitalOpportunity: 360_000,
  },
  {
    id: 'mental_health',
    label: 'Psikolog / Psikiyatri Kliniği',
    aliases: ['psikolog', 'psikiyatri', 'psychologist', 'psychiatry', 'psychotherapist'],
    selectors: [
      ['healthcare', 'psychotherapist'],
      ['healthcare', 'psychologist'],
      ['healthcare:speciality', 'psychiatry'],
    ],
    baseContractValue: 42_000,
    monthlyDigitalOpportunity: 155_000,
  },
  {
    id: 'lawyer',
    label: 'Hukuk / Danışmanlık',
    aliases: ['avukat', 'hukuk', 'lawyer', 'attorney'],
    selectors: [['office', 'lawyer']],
    baseContractValue: 38_000,
    monthlyDigitalOpportunity: 140_000,
  },
  {
    id: 'restaurant',
    label: 'Restoran / Kafe',
    aliases: ['restoran', 'restaurant', 'kafe', 'cafe', 'lokanta', 'yemek'],
    selectors: [
      ['amenity', 'restaurant'],
      ['amenity', 'cafe'],
      ['amenity', 'fast_food'],
    ],
    baseContractValue: 30_000,
    monthlyDigitalOpportunity: 100_000,
  },
  {
    id: 'automotive',
    label: 'Oto Servis / Ekspertiz',
    aliases: ['oto servis', 'ekspertiz', 'otomotiv', 'tamir', 'car repair', 'kaporta'],
    selectors: [
      ['shop', 'car_repair'],
      ['craft', 'car_repair'],
      ['shop', 'tyres'],
      ['amenity', 'vehicle_inspection'],
    ],
    baseContractValue: 34_000,
    monthlyDigitalOpportunity: 130_000,
  },
  {
    id: 'home_services',
    label: 'Ev Hizmetleri / Tesisat',
    aliases: ['tesisat', 'tesisatci', 'plumber', 'elektrikci', 'iklimlendirme'],
    selectors: [
      ['craft', 'plumber'],
      ['craft', 'electrician'],
      ['craft', 'hvac'],
    ],
    baseContractValue: 28_000,
    monthlyDigitalOpportunity: 120_000,
  },
  {
    id: 'retail',
    label: 'Perakende / Mağaza',
    aliases: [
      'ticaret',
      'magaza',
      'magza',
      'dukkan',
      'perakende',
      'market',
      'alisveris',
      'shop',
      'store',
    ],
    selectors: [['shop']],
    baseContractValue: 32_000,
    monthlyDigitalOpportunity: 125_000,
  },
  {
    id: 'beauty',
    label: 'Güzellik Merkezi / Lazer Epilasyon',
    aliases: ['güzellik merkezi', 'guzellik merkezi', 'lazer epilasyon', 'kuafor', 'berber', 'beauty', 'hairdresser'],
    selectors: [
      ['shop', 'beauty'],
      ['shop', 'hairdresser'],
    ],
    baseContractValue: 27_000,
    monthlyDigitalOpportunity: 95_000,
  },
  {
    id: 'real_estate',
    label: 'Gayrimenkul / Emlak',
    aliases: ['emlak', 'gayrimenkul', 'real estate', 'estate agent'],
    selectors: [['office', 'estate_agent']],
    baseContractValue: 36_000,
    monthlyDigitalOpportunity: 160_000,
  },
  {
    id: 'hotel',
    label: 'Konaklama / Otel',
    aliases: ['otel', 'hotel', 'pansiyon', 'konaklama'],
    selectors: [
      ['tourism', 'hotel'],
      ['tourism', 'guest_house'],
      ['tourism', 'hostel'],
    ],
    baseContractValue: 44_000,
    monthlyDigitalOpportunity: 190_000,
  },
  {
    id: 'veterinary',
    label: 'Veteriner Kliniği',
    aliases: ['veteriner', 'veteriner kliniği', 'veterinary', 'hayvan klinigi'],
    selectors: [['amenity', 'veterinary']],
    baseContractValue: 32_000,
    monthlyDigitalOpportunity: 120_000,
  },
  {
    id: 'construction',
    label: 'İnşaat / Müteahhitlik',
    aliases: ['inşaat', 'insaat', 'müteahhit', 'muteahhit', 'construction', 'builder'],
    selectors: [
      ['office', 'construction_company'],
      ['craft', 'builder'],
    ],
    baseContractValue: 58_000,
    monthlyDigitalOpportunity: 250_000,
  },
  {
    id: 'architecture',
    label: 'Mimarlık / İç Mimarlık',
    aliases: ['mimarlık', 'mimarlik', 'iç mimarlık', 'ic mimarlik', 'architect'],
    selectors: [['office', 'architect']],
    baseContractValue: 48_000,
    monthlyDigitalOpportunity: 185_000,
  },
  {
    id: 'private_school',
    label: 'Özel Okul / Kolej',
    aliases: ['özel okul', 'ozel okul', 'kolej', 'private school', 'college'],
    selectors: [['amenity', 'school']],
    baseContractValue: 58_000,
    monthlyDigitalOpportunity: 230_000,
  },
  {
    id: 'course',
    label: 'Dil Okulu / Özel Kurs',
    aliases: ['dil okulu', 'özel kurs', 'ozel kurs', 'language school', 'eğitim merkezi', 'egitim merkezi'],
    selectors: [
      ['amenity', 'language_school'],
      ['amenity', 'training'],
    ],
    baseContractValue: 38_000,
    monthlyDigitalOpportunity: 145_000,
  },
  {
    id: 'car_dealer',
    label: 'Oto Galeri / Yetkili Satıcı',
    aliases: ['oto galeri', 'yetkili satıcı', 'yetkili satici', 'car dealer', 'otomobil galerisi'],
    selectors: [['shop', 'car']],
    baseContractValue: 55_000,
    monthlyDigitalOpportunity: 245_000,
  },
  {
    id: 'car_rental',
    label: 'Araç Kiralama',
    aliases: ['araç kiralama', 'arac kiralama', 'rent a car', 'car rental'],
    selectors: [['amenity', 'car_rental']],
    baseContractValue: 45_000,
    monthlyDigitalOpportunity: 190_000,
  },
  {
    id: 'furniture',
    label: 'Mobilya / Özel Mutfak',
    aliases: ['mobilya', 'özel mutfak', 'ozel mutfak', 'furniture', 'kitchen'],
    selectors: [
      ['shop', 'furniture'],
      ['shop', 'kitchen'],
      ['craft', 'cabinet_maker'],
    ],
    baseContractValue: 46_000,
    monthlyDigitalOpportunity: 175_000,
  },
  {
    id: 'jewelry',
    label: 'Kuyumcu / Mücevher',
    aliases: ['kuyumcu', 'mücevher', 'mucevher', 'jewelry', 'jewellery'],
    selectors: [['shop', 'jewelry']],
    baseContractValue: 48_000,
    monthlyDigitalOpportunity: 180_000,
  },
  {
    id: 'fitness',
    label: 'Spor Salonu / Pilates',
    aliases: ['spor salonu', 'pilates', 'fitness', 'gym'],
    selectors: [['leisure', 'fitness_centre']],
    baseContractValue: 38_000,
    monthlyDigitalOpportunity: 150_000,
  },
  {
    id: 'event_venue',
    label: 'Düğün Salonu / Etkinlik Mekanı',
    aliases: ['düğün salonu', 'dugun salonu', 'etkinlik mekanı', 'etkinlik mekani', 'event venue', 'wedding hall'],
    selectors: [['amenity', 'events_venue']],
    baseContractValue: 48_000,
    monthlyDigitalOpportunity: 210_000,
  },
  {
    id: 'travel_agency',
    label: 'Tur / Seyahat Acentesi',
    aliases: ['seyahat acentesi', 'tur acentesi', 'travel agency', 'travel agent', 'tour operator'],
    selectors: [['office', 'travel_agent']],
    baseContractValue: 42_000,
    monthlyDigitalOpportunity: 175_000,
  },
  {
    id: 'insurance',
    label: 'Sigorta Acentesi',
    aliases: ['sigorta acentesi', 'sigorta', 'insurance agency', 'insurance'],
    selectors: [['office', 'insurance']],
    baseContractValue: 42_000,
    monthlyDigitalOpportunity: 165_000,
  },
];

const DEFAULT_PROFILE: IndustryProfile = {
  id: 'local_business',
  label: 'Yerel İşletme',
  aliases: [],
  selectors: [],
  baseContractValue: 30_000,
  monthlyDigitalOpportunity: 100_000,
};

const LOCAL_BUSINESS_TYPES = new Set([
  'LocalBusiness',
  'Dentist',
  'MedicalBusiness',
  'MedicalClinic',
  'Physician',
  'Attorney',
  'LegalService',
  'Restaurant',
  'CafeOrCoffeeShop',
  'AutoRepair',
  'Plumber',
  'HomeAndConstructionBusiness',
  'BeautySalon',
  'RealEstateAgent',
  'Hotel',
  'VeterinaryCare',
  'Store',
]);

export function resolveIndustryProfile(industry: string): IndustryProfile {
  const normalized = normalizeText(industry);
  return (
    INDUSTRY_PROFILES.find((profile) =>
      profile.aliases.some((alias) => normalized.includes(normalizeText(alias))),
    ) ?? { ...DEFAULT_PROFILE, label: industry.trim() || DEFAULT_PROFILE.label }
  );
}

function extractTag(html: string, tagName: string): string {
  const match = html.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'),
  );
  return match ? stripTags(match[1]) : '';
}

function getAttribute(tag: string, name: string): string {
  const quoted = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'),
  );
  if (quoted) return decodeHtml(quoted[2]);
  const unquoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return unquoted ? decodeHtml(unquoted[1]) : '';
}

function findMetaContent(html: string, key: string, value: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const target = value.toLowerCase();
  for (const tag of tags) {
    if (getAttribute(tag, key).toLowerCase() === target) {
      return getAttribute(tag, 'content');
    }
  }
  return '';
}

function parseJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const matches = html.matchAll(
    /<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of matches) {
    try {
      results.push(JSON.parse(match[2].trim()));
    } catch {
      // Invalid JSON-LD is deliberately not counted as usable structured data.
    }
  }
  return results;
}

function collectSchemaTypes(value: unknown, target = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, target));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === '@type') {
        const types = Array.isArray(child) ? child : [child];
        types.forEach((type) => {
          if (typeof type === 'string') target.add(type);
        });
      }
      collectSchemaTypes(child, target);
    }
  }
  return target;
}

function jsonLdContainsKey(value: unknown, wanted: string): boolean {
  if (Array.isArray(value)) return value.some((item) => jsonLdContainsKey(item, wanted));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => key === wanted || jsonLdContainsKey(child, wanted),
  );
}

function isAiBotAllowed(robotsTxt: string): boolean {
  if (!robotsTxt.trim()) return true;
  const groups = robotsTxt
    .split(/\n(?=\s*user-agent\s*:)/i)
    .map((group) => group.replace(/#.*$/gm, ''));
  const aiBotNames = ['gptbot', 'chatgpt-user', 'perplexitybot', 'google-extended'];

  return !groups.some((group) => {
    const agents = [...group.matchAll(/user-agent\s*:\s*([^\s#]+)/gi)].map(
      (match) => match[1].toLowerCase(),
    );
    const targetsAi = agents.some(
      (agent) => agent === '*' || aiBotNames.includes(agent),
    );
    const blocksRoot = /disallow\s*:\s*\/\s*(?:$|\n)/im.test(group);
    return targetsAi && blocksRoot;
  });
}

function speedPoints(loadTimeSec: number): number {
  if (loadTimeSec <= 1.5) return 20;
  if (loadTimeSec <= 2.5) return 16;
  if (loadTimeSec <= 4) return 10;
  if (loadTimeSec <= 6) return 5;
  return 0;
}

function gradeFor(score: number): AiSearchVisibilityGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function calculateMapScore(map?: MapEvidence): number {
  if (!map?.exists) return 0;
  const completeness = clamp(map.profileCompleteness ?? 40);
  const ratingPoints = map.rating ? clamp((map.rating / 5) * 30, 0, 30) : 10;
  const reviewPoints = map.reviewCount
    ? clamp(Math.log10(map.reviewCount + 1) * 12, 0, 20)
    : 0;
  return rounded(
    25 +
      completeness * 0.25 +
      ratingPoints +
      reviewPoints +
      (map.hasOwnerResponses ? 10 : 0),
  );
}

function estimateCommercialValue(
  profile: IndustryProfile,
  overallScore: number,
): { contract: number; monthlyLoss: number } {
  const gap = clamp(100 - overallScore) / 100;
  const contract = Math.round(
    (profile.baseContractValue * (0.75 + gap * 0.55)) / 1_000,
  ) * 1_000;
  const monthlyLoss = Math.round(
    (profile.monthlyDigitalOpportunity * gap * 0.62) / 1_000,
  ) * 1_000;
  return { contract, monthlyLoss };
}

function selectOpportunities(
  signals: {
    hasWebsite: boolean;
    mapsVerified: boolean;
    mapsExists: boolean;
    mapsClaimed?: boolean;
    rating: number;
    viewport: boolean;
    hasJsonLd: boolean;
    technicalScore: number;
    tableLayout: boolean;
  },
): OpportunityType[] {
  const weighted: Array<[OpportunityType, number]> = [];
  if (!signals.hasWebsite) weighted.push(['missing_website', 100]);
  if (signals.mapsVerified && !signals.mapsExists) weighted.push(['no_maps', 95]);
  if (!signals.viewport && signals.hasWebsite) weighted.push(['non_mobile', 85]);
  if (!signals.hasJsonLd && signals.hasWebsite) weighted.push(['no_geo_schema', 78]);
  if (
    signals.hasWebsite &&
    (signals.technicalScore < 50 || signals.tableLayout)
  ) {
    weighted.push(['outdated_html', 70]);
  }
  if (signals.rating > 0 && signals.rating < 3.8) {
    weighted.push(['low_rating', 64]);
  }
  if (
    signals.mapsVerified &&
    signals.mapsExists &&
    signals.mapsClaimed === false
  ) {
    weighted.push(['maps_unclaimed', 55]);
  }
  if (!weighted.length) weighted.push(['no_geo_schema', 25]);
  return weighted.sort((a, b) => b[1] - a[1]).map(([type]) => type);
}

export function analyzeWebsiteEvidence(
  evidence: WebsiteEvidence,
  context: AuditContext = {},
): AuditAnalysis {
  const html = evidence.html;
  const hasDoctype = /<!doctype\s+html(?:\s|>)/i.test(html);
  const viewport = findMetaContent(html, 'name', 'viewport');
  const hasViewport = /width\s*=\s*device-width/i.test(viewport);
  const semanticTagCount =
    (html.match(/<(header|nav|main|article|section|footer)\b/gi) ?? []).length;
  const hasSemanticTags = semanticTagCount >= 2;
  const tableCount = (html.match(/<table\b/gi) ?? []).length;
  const hasTableLayout =
    tableCount >= 2 &&
    !/<(?:main|article|section)\b/i.test(html) &&
    !/role\s*=\s*["'](?:grid|table)["']/i.test(html);
  const loadTimeSec = Number((evidence.loadTimeMs / 1000).toFixed(1));
  const hasSsl = new URL(evidence.finalUrl).protocol === 'https:';

  const title = extractTag(html, 'title');
  const metaDescription = findMetaContent(html, 'name', 'description');
  const h1Text = extractTag(html, 'h1');
  const hasOpenGraph = Boolean(findMetaContent(html, 'property', 'og:title'));
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAlt = images.filter((tag) => getAttribute(tag, 'alt').trim()).length;
  const imageAltRatio = images.length
    ? rounded((imagesWithAlt / images.length) * 100)
    : 100;

  const structuredData = parseJsonLd(html);
  const schemaTypes = collectSchemaTypes(structuredData);
  const hasJsonLd = structuredData.length > 0;
  const hasLocalBusinessSchema = [...schemaTypes].some((type) =>
    LOCAL_BUSINESS_TYPES.has(type),
  );
  const pageText = normalizeText(stripTags(html).slice(0, 50_000));
  const phoneDigits = (context.phone || '').replace(/\D/g, '').slice(-7);
  const businessTokens = normalizeText(context.businessName || '')
    .split(' ')
    .filter((token) => token.length > 2);
  const nameMentioned =
    businessTokens.length === 0 ||
    businessTokens.filter((token) => pageText.includes(token)).length >=
      Math.min(2, businessTokens.length);
  const phoneMentioned = !phoneDigits || pageText.replace(/\D/g, '').includes(phoneDigits);
  const hasNapData =
    hasLocalBusinessSchema &&
    nameMentioned &&
    phoneMentioned &&
    (jsonLdContainsKey(structuredData, 'address') ||
      /\b(?:adres|address)\b/i.test(pageText));
  const aiAllowed = isAiBotAllowed(evidence.robotsTxt);
  const geoCoordinatesFound =
    jsonLdContainsKey(structuredData, 'latitude') &&
    jsonLdContainsKey(structuredData, 'longitude');

  const entitySignals = [
    nameMentioned,
    Boolean(context.industry && pageText.includes(normalizeText(context.industry).split(' ')[0])),
    Boolean(context.city && pageText.includes(normalizeText(context.city))),
    Boolean(h1Text),
    hasLocalBusinessSchema,
  ];
  const entityClarity = rounded(
    (entitySignals.filter(Boolean).length / entitySignals.length) * 100,
  );

  const technicalScore = rounded(
    (hasDoctype ? 10 : 0) +
      (hasViewport ? 25 : 0) +
      (hasSsl ? 20 : 0) +
      (hasSemanticTags ? 15 : 0) +
      (!hasTableLayout ? 10 : 0) +
      speedPoints(loadTimeSec),
  );
  const seoScore = rounded(
    (title && title.length >= 20 && title.length <= 65 ? 20 : title ? 10 : 0) +
      (metaDescription && metaDescription.length >= 70 && metaDescription.length <= 170
        ? 20
        : metaDescription
          ? 10
          : 0) +
      (h1Text ? 20 : 0) +
      (hasOpenGraph ? 10 : 0) +
      imageAltRatio * 0.15 +
      (hasJsonLd ? 15 : 0),
  );
  const geoScore = rounded(
    (hasJsonLd ? 20 : 0) +
      (hasLocalBusinessSchema ? 25 : 0) +
      (hasNapData ? 15 : 0) +
      (aiAllowed ? 10 : 0) +
      (geoCoordinatesFound ? 10 : 0) +
      entityClarity * 0.2,
  );
  const mapsScore = calculateMapScore(context.map);
  const mapsVerified = Boolean(context.map);
  const overallScore = mapsVerified
    ? rounded(
        technicalScore * 0.25 +
          seoScore * 0.25 +
          geoScore * 0.3 +
          mapsScore * 0.2,
      )
    : rounded(technicalScore * 0.34 + seoScore * 0.3 + geoScore * 0.36);

  const criticalFlaws: string[] = [];
  const quickFixes: string[] = [];
  if (!hasViewport) {
    criticalFlaws.push('Mobil viewport tanımı eksik veya hatalı.');
    quickFixes.push('Mobile-first viewport ve responsive kırılım testlerini uygulayın.');
  }
  if (!hasSsl) {
    criticalFlaws.push('Site güvenli HTTPS bağlantısı sunmuyor.');
    quickFixes.push('HTTPS yönlendirmesini ve geçerli TLS sertifikasını etkinleştirin.');
  }
  if (!title || !metaDescription || !h1Text) {
    criticalFlaws.push('Temel SEO başlık, açıklama veya H1 sinyalleri eksik.');
    quickFixes.push('Her hizmet ve konum için özgün title, description ve H1 yapısı kurun.');
  }
  if (!hasLocalBusinessSchema) {
    criticalFlaws.push('LocalBusiness türünde geçerli JSON-LD yapılandırılmış veri yok.');
    quickFixes.push('İşletme türüne özel Schema.org JSON-LD verisini doğrulanabilir NAP bilgisiyle ekleyin.');
  }
  if (!aiAllowed) {
    criticalFlaws.push('robots.txt önemli AI tarayıcılarını tamamen engelliyor.');
    quickFixes.push('robots.txt kurallarını içerik ve gizlilik politikanıza göre gözden geçirin.');
  }
  if (hasTableLayout) {
    criticalFlaws.push('Sayfada eski tablo tabanlı yerleşim sinyalleri tespit edildi.');
    quickFixes.push('Yerleşimi semantik HTML5 ve modern CSS düzenine taşıyın.');
  }
  if (loadTimeSec > 4) {
    criticalFlaws.push(`İlk HTML yanıtı yavaş (${loadTimeSec} sn).`);
    quickFixes.push('Sunucu yanıtı, görseller, önbellek ve kritik kaynak zincirini optimize edin.');
  }
  if (!criticalFlaws.length) {
    criticalFlaws.push('Büyük bir teknik engel bulunmadı; yerel görünürlük derinleştirilebilir.');
  }
  if (!quickFixes.length) {
    quickFixes.push('Konum ve hizmet sayfalarını ölçülebilir yerel arama hedefleriyle genişletin.');
  }

  const opportunities = selectOpportunities({
    hasWebsite: true,
    mapsVerified,
    mapsExists: context.map?.exists ?? false,
    mapsClaimed: context.map?.isClaimed,
    rating: context.map?.rating ?? 0,
    viewport: hasViewport,
    hasJsonLd,
    technicalScore,
    tableLayout: hasTableLayout,
  });
  const profile = resolveIndustryProfile(context.industry || '');
  const commercial = estimateCommercialValue(profile, overallScore);
  const reasons = [
    ...criticalFlaws.slice(0, 3),
    `${overallScore}/100 dijital sağlık skoru`,
  ];
  const potentialScore = rounded(
    clamp(100 - overallScore) * 0.72 +
      (context.phone ? 10 : 0) +
      (context.map?.exists ? 8 : 0) +
      (context.businessName ? 5 : 0),
  );
  const businessLabel = context.businessName || 'Bu işletme';

  return {
    audit: {
      overallScore,
      technicalScore,
      seoScore,
      geoScore,
      mapsScore,
      technical: {
        isHtml5Valid: hasDoctype,
        hasViewportMeta: hasViewport,
        hasSsl,
        hasSemanticTags,
        hasTableLayout,
        loadingSpeedSec: loadTimeSec,
      },
      seo: {
        title,
        hasTitle: Boolean(title),
        titleLength: title.length,
        metaDescription,
        hasMetaDescription: Boolean(metaDescription),
        hasOpenGraph,
        hasH1: Boolean(h1Text),
        h1Text,
        imageAltRatio,
      },
      geo: {
        hasJsonLd,
        hasLocalBusinessSchema,
        hasNapData,
        isAiBotAllowed: aiAllowed,
        geoCoordinatesFound,
        nlpEntityClarityScore: entityClarity,
        aiSearchVisibilityGrade: gradeFor(geoScore),
      },
      maps: {
        existsOnMaps: context.map?.exists ?? false,
        isClaimed: context.map?.isClaimed ?? false,
        rating: context.map?.rating ?? 0,
        reviewCount: context.map?.reviewCount ?? 0,
        hasOwnerResponses: context.map?.hasOwnerResponses ?? false,
        categoryMatched: context.map?.categoryMatched ?? false,
        isVerified: mapsVerified,
        dataSource: mapsVerified ? 'openstreetmap' : 'unknown',
      },
      criticalFlaws: criticalFlaws.slice(0, 6),
      quickFixes: quickFixes.slice(0, 6),
      estimatedMonthlyLeadLoss: commercial.monthlyLoss,
      aiRecommendationSummary: `${businessLabel}, ölçülen teknik, SEO ve yapılandırılmış veri sinyallerine göre ${overallScore}/100 dijital sağlık skorunda. Öncelik “${criticalFlaws[0]}” bulgusunun giderilmesi ve ilerlemenin trafik, arama görünürlüğü ve dönüşüm verileriyle ölçülmesidir.`,
    },
    primaryOpportunity: opportunities[0],
    secondaryOpportunities: opportunities.slice(1, 4),
    estimatedContractValue: commercial.contract,
    potentialScore: clamp(potentialScore),
    reasons,
  };
}

export function createMissingWebsiteAnalysis(
  context: AuditContext,
): AuditAnalysis {
  const mapsScore = calculateMapScore(context.map);
  const overallScore = rounded(mapsScore * 0.25);
  const profile = resolveIndustryProfile(context.industry || '');
  const commercial = estimateCommercialValue(profile, overallScore);
  const opportunities = selectOpportunities({
    hasWebsite: false,
    mapsVerified: Boolean(context.map),
    mapsExists: context.map?.exists ?? false,
    mapsClaimed: context.map?.isClaimed,
    rating: context.map?.rating ?? 0,
    viewport: false,
    hasJsonLd: false,
    technicalScore: 0,
    tableLayout: false,
  });
  const businessLabel = context.businessName || 'İşletme';

  return {
    audit: {
      overallScore,
      technicalScore: 0,
      seoScore: 0,
      geoScore: 0,
      mapsScore,
      technical: {
        isHtml5Valid: false,
        hasViewportMeta: false,
        hasSsl: false,
        hasSemanticTags: false,
        hasTableLayout: false,
        loadingSpeedSec: 0,
      },
      seo: {
        title: '',
        hasTitle: false,
        titleLength: 0,
        metaDescription: '',
        hasMetaDescription: false,
        hasOpenGraph: false,
        hasH1: false,
        imageAltRatio: 0,
      },
      geo: {
        hasJsonLd: false,
        hasLocalBusinessSchema: false,
        hasNapData: false,
        isAiBotAllowed: true,
        geoCoordinatesFound: false,
        nlpEntityClarityScore: 0,
        aiSearchVisibilityGrade: 'F',
      },
      maps: {
        existsOnMaps: context.map?.exists ?? false,
        isClaimed: context.map?.isClaimed ?? false,
        rating: context.map?.rating ?? 0,
        reviewCount: context.map?.reviewCount ?? 0,
        hasOwnerResponses: context.map?.hasOwnerResponses ?? false,
        categoryMatched: context.map?.categoryMatched ?? false,
        isVerified: Boolean(context.map),
        dataSource: context.map ? 'openstreetmap' : 'unknown',
      },
      criticalFlaws: [
        'Resmî bir web sitesi kaydı bulunamadı.',
        'Arama motorlarının okuyabileceği hizmet ve konum sayfaları yok.',
        'İşletmeye ait yapılandırılmış veri ve dönüşüm kanalları eksik.',
      ],
      quickFixes: [
        'Hızlı, mobil öncelikli ve erişilebilir bir kurumsal site kurun.',
        'Hizmet ve konum sayfalarını arama niyetine göre yapılandırın.',
        'LocalBusiness JSON-LD, telefon ve teklif/randevu dönüşümlerini ekleyin.',
      ],
      estimatedMonthlyLeadLoss: commercial.monthlyLoss,
      aiRecommendationSummary: `${businessLabel} için doğrulanabilir bir web sitesi bulunamadı. Harita varlığını tamamlayan, ölçülebilir dönüşüm hedeflerine sahip mobil bir site en yüksek öncelikli fırsattır.`,
    },
    primaryOpportunity: opportunities[0],
    secondaryOpportunities: opportunities.slice(1, 4),
    estimatedContractValue: commercial.contract,
    potentialScore: clamp(92 + (context.phone ? 5 : 0)),
    reasons: [
      'Resmî web sitesi bulunamadı',
      context.phone ? 'Doğrudan iletişim bilgisi mevcut' : 'İletişim verisi eksik',
      `${overallScore}/100 dijital sağlık skoru`,
    ],
  };
}

export function createUnavailableWebsiteAnalysis(
  websiteUrl: string,
  context: AuditContext,
  reason: string,
): AuditAnalysis {
  const result = createMissingWebsiteAnalysis(context);
  result.primaryOpportunity = 'outdated_html';
  result.secondaryOpportunities = ['no_geo_schema', 'non_mobile'];
  result.potentialScore = clamp(result.potentialScore - 7);
  result.audit.criticalFlaws = [
    `Kayıtlı web sitesi tarama sırasında erişilebilir değildi: ${reason}`,
    'Teknik, SEO ve yapılandırılmış veri sinyalleri doğrulanamadı.',
    'Kesinti veya yönlendirme sorunu potansiyel müşterilerin siteye ulaşmasını engelliyor olabilir.',
  ];
  result.audit.quickFixes = [
    'Alan adı, DNS, TLS sertifikası ve sunucu yanıtını kontrol edin.',
    'Site erişildikten sonra teknik SEO ve GEO taramasını yeniden çalıştırın.',
    'Kesintileri izlemek için çalışma süresi takibi kurun.',
  ];
  result.audit.aiRecommendationSummary = `${context.businessName || 'İşletme'} için ${websiteUrl} adresi kayıtlı, ancak tarama sırasında erişilemedi. Önce erişilebilirlik doğrulanmalı; teknik fırsat skoru site tekrar çevrimiçi olduğunda yenilenmelidir.`;
  result.reasons = [
    'Kayıtlı web sitesine erişilemedi',
    reason,
    ...(context.phone ? ['Doğrudan iletişim bilgisi mevcut'] : []),
  ];
  return result;
}

export async function auditWebsite(
  rawUrl: string,
  context: AuditContext = {},
): Promise<{ url: string; analysis: AuditAnalysis }> {
  const page = await fetchLimited(rawUrl, {
    timeoutMs: 10_000,
    maxBytes: 2_000_000,
  });
  const contentType = page.headers.get('content-type') || '';
  if (!page.ok) {
    throw new Error(`Web sitesi HTTP ${page.status} yanıtı verdi.`);
  }
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error('Adres bir HTML web sayfası döndürmedi.');
  }

  let robotsTxt = '';
  try {
    const robotsUrl = new URL('/robots.txt', page.url).toString();
    const robots = await fetchLimited(robotsUrl, {
      timeoutMs: 4_000,
      maxBytes: 200_000,
    });
    if (robots.ok) robotsTxt = robots.body;
  } catch {
    // A missing or unavailable robots.txt is equivalent to no crawler restriction.
  }

  const analysis = analyzeWebsiteEvidence(
    {
      requestedUrl: rawUrl,
      finalUrl: page.url,
      html: page.body,
      robotsTxt,
      statusCode: page.status,
      loadTimeMs: page.elapsedMs,
    },
    context,
  );

  return { url: page.url, analysis };
}
