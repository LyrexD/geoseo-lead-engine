import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildLocationCenterQuery,
  buildOverpassQuery,
} from '../backend/discovery';
import { createMissingWebsiteAnalysis } from '../backend/audit';
import { generateProposal } from '../backend/proposal';
import { ProspectStore } from '../backend/store';
import type { Prospect } from '../src/types';

function makeProspect(): Prospect {
  const analysis = createMissingWebsiteAnalysis({
    businessName: 'Test Veteriner',
    industry: 'Veteriner',
    city: 'İstanbul',
    district: 'Kadıköy',
    phone: '0216 000 00 00',
    map: { exists: true, profileCompleteness: 75 },
  });
  const now = new Date().toISOString();
  return {
    id: 'prospect-test',
    businessName: 'Test Veteriner',
    industry: 'Veteriner',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Kadıköy, İstanbul',
    phone: '0216 000 00 00',
    email: '',
    websiteUrl: '',
    mapsUrl: 'https://www.openstreetmap.org/node/1',
    lat: 40.98,
    lng: 29.03,
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
      sourceId: 'node/1',
      sourceUrl: 'https://www.openstreetmap.org/node/1',
      discoveredAt: now,
      potentialScore: analysis.potentialScore,
      reasons: analysis.reasons,
    },
  };
}

test('Overpass sorgusu konumu ve sektör etiketini sınırlar', () => {
  const query = buildOverpassQuery({
    location: 'Kadıköy, İstanbul',
    industry: 'diş hekimi',
    limit: 12,
  });

  assert.match(query, /name"="Kadıköy/);
  assert.match(query, /amenity"="dentist/);
  assert.match(query, /out center tags qt/);
});

test('şehir ve mağaza araması pahalı serbest metin yerine merkez ve shop etiketlerini kullanır', () => {
  const centerQuery = buildLocationCenterQuery('İzmir');
  const query = buildOverpassQuery({
    location: 'İzmir',
    industry: 'Ticaret',
    limit: 12,
  }, false, { lat: 38.4237, lng: 27.1428 });

  assert.match(centerQuery, /place"~"\^\(city\|town\|borough\|suburb\)\$"/);
  assert.match(centerQuery, /name:en/);
  assert.match(query, /nwr\(38\.\d+,27\.\d+,38\.\d+,27\.\d+\)\["shop"\]/);
  assert.doesNotMatch(query, /name"~"Ticaret/);
  assert.doesNotMatch(query, /around/);
});

test('yüksek potansiyelli hazır sektörler doğru işletme etiketlerine çevrilir', () => {
  const location = 'İzmir';
  const center = { lat: 38.4237, lng: 27.1428 };
  const cases = [
    ['Saç Ekimi / Medikal Estetik', /healthcare:speciality"="plastic_surgery/],
    ['Özel Okul / Kolej', /amenity"="school/],
    ['Oto Galeri / Yetkili Satıcı', /shop"="car/],
    ['Kuyumcu / Mücevher', /shop"="jewelry/],
    ['Düğün Salonu / Etkinlik Mekanı', /amenity"="events_venue/],
  ] as const;

  for (const [industry, expectedSelector] of cases) {
    const query = buildOverpassQuery(
      { location, industry, limit: 12 },
      false,
      center,
    );
    assert.match(query, expectedSelector, industry);
  }
});

test('şehir ve ilçe iki yazım sırasında da doğru ayrıştırılır', () => {
  const districtFirst = buildOverpassQuery({
    location: 'Karabağlar, İzmir',
    industry: 'Ticaret',
    limit: 12,
  });
  const cityFirst = buildOverpassQuery({
    location: 'İzmir, Karabağlar',
    industry: 'Ticaret',
    limit: 12,
  });

  assert.match(districtFirst, /name"="Karabağlar"/);
  assert.match(cityFirst, /name"="Karabağlar"/);
  assert.doesNotMatch(cityFirst, /name"="İzmir"/);
});

test('CRM deposu kayıtları birleştirir, aşama ve notları kalıcılaştırır', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geoseo-store-'));
  const filePath = path.join(directory, 'prospects.json');
  const store = new ProspectStore(filePath);
  const original = makeProspect();

  const first = await store.upsertMany([original]);
  assert.equal(first.added, 1);

  const rediscovered = {
    ...original,
    businessName: 'Test Veteriner Kliniği',
    audit: { ...original.audit, overallScore: 12 },
  };
  const second = await store.upsertMany([rediscovered]);
  assert.equal(second.updated, 1);
  await store.updateStatus(original.id, 'negotiating');
  await store.addNote(original.id, 'Telefon görüşmesi planlandı.');

  const reloaded = new ProspectStore(filePath);
  const [saved] = await reloaded.list();
  assert.equal(saved.status, 'negotiating');
  assert.deepEqual(saved.notes, ['Telefon görüşmesi planlandı.']);
  assert.equal(saved.businessName, 'Test Veteriner Kliniği');
  assert.equal(saved.audit.overallScore, 12);

  const raw = JSON.parse(await readFile(filePath, 'utf8'));
  assert.equal(raw.version, 1);
});

test('analiz edilen işletme yeniden keşfedildiğinde analiz sonucu korunur', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geoseo-analyzed-store-'));
  const filePath = path.join(directory, 'prospects.json');
  const store = new ProspectStore(filePath);
  const original = makeProspect();

  await store.create(original);
  await store.updateStatus(original.id, 'audited');

  const rediscovered = {
    ...original,
    businessName: 'Yeniden Bulunan İşletme',
    audit: { ...original.audit, overallScore: 1 },
  };
  const result = await store.upsertMany([rediscovered]);

  assert.equal(result.updated, 0);
  assert.equal(result.skipped, 1);

  const [saved] = await store.list();
  assert.equal(saved.status, 'audited');
  assert.equal(saved.businessName, original.businessName);
  assert.equal(saved.audit.overallScore, original.audit.overallScore);
});

test('işletme kapalı durumu CRM deposunda kalıcı olarak saklanır', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'geoseo-closed-store-'));
  const filePath = path.join(directory, 'prospects.json');
  const store = new ProspectStore(filePath);
  const original = makeProspect();

  await store.create(original);
  const updated = await store.updateStatus(original.id, 'closed');
  assert.equal(updated.status, 'closed');

  const reloaded = new ProspectStore(filePath);
  const [saved] = await reloaded.list();
  assert.equal(saved.status, 'closed');
});

test('teklif motoru bulgulara göre eksiksiz ve ölçülebilir çıktı üretir', () => {
  const prospect = makeProspect();
  const proposal = generateProposal(prospect, 'Test Ajans');

  assert.equal(proposal.proposedServices.length, 3);
  assert.ok(proposal.auditHighlights.length >= 3);
  assert.match(proposal.executiveSummary, /garanti değil/i);
  assert.match(proposal.whatsappMessage, /Test Veteriner/);
  assert.equal(proposal.expectedResults.length, 4);
});
