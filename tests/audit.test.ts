import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeWebsiteEvidence,
  createMissingWebsiteAnalysis,
} from '../backend/audit';
import { isPrivateAddress } from '../backend/network';

test('kanıta dayalı audit güçlü ve zayıf sayfaları farklı puanlar', () => {
  const strongHtml = `<!doctype html>
  <html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kadıköy Örnek Diş Kliniği ve İmplant Tedavisi</title>
    <meta name="description" content="${'Kadıköy diş kliniğinde implant, estetik diş hekimliği ve randevu hizmetleri. '.repeat(2)}">
    <meta property="og:title" content="Örnek Diş Kliniği">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Dentist","name":"Örnek Diş Kliniği","telephone":"02161112233","address":{"streetAddress":"Moda Cad. 1, Kadıköy"},"geo":{"latitude":40.9,"longitude":29.0}}
    </script>
  </head><body>
    <header><nav>Menü</nav></header>
    <main><h1>Kadıköy Örnek Diş Kliniği</h1><section>İmplant ve diş sağlığı</section></main>
    <footer>Örnek Diş Kliniği 0216 111 22 33 Kadıköy İstanbul adres</footer>
    <img src="clinic.jpg" alt="Kadıköy diş kliniği">
  </body></html>`;
  const weakHtml =
    '<html><head><title>Ana Sayfa</title></head><body><table><tr><td>Hoş geldiniz</td></tr></table><table></table></body></html>';
  const context = {
    businessName: 'Örnek Diş Kliniği',
    industry: 'Diş Hekimi',
    city: 'İstanbul',
    district: 'Kadıköy',
    phone: '0216 111 22 33',
    map: {
      exists: true,
      categoryMatched: true,
      profileCompleteness: 100,
    },
  };

  const strong = analyzeWebsiteEvidence(
    {
      requestedUrl: 'https://example.com',
      finalUrl: 'https://example.com',
      html: strongHtml,
      robotsTxt: '',
      statusCode: 200,
      loadTimeMs: 900,
    },
    context,
  );
  const weak = analyzeWebsiteEvidence(
    {
      requestedUrl: 'http://example.com',
      finalUrl: 'http://example.com',
      html: weakHtml,
      robotsTxt: 'User-agent: GPTBot\nDisallow: /',
      statusCode: 200,
      loadTimeMs: 7_000,
    },
    context,
  );

  assert.ok(strong.audit.overallScore > weak.audit.overallScore);
  assert.ok(strong.audit.geoScore >= 80);
  assert.equal(weak.audit.technical.hasViewportMeta, false);
  assert.equal(weak.audit.geo.isAiBotAllowed, false);
  assert.ok(weak.audit.criticalFlaws.length >= 4);
});

test('web sitesi olmayan aday en yüksek öncelikli fırsata dönüşür', () => {
  const result = createMissingWebsiteAnalysis({
    businessName: 'Örnek Servis',
    industry: 'Oto Servis',
    phone: '0532 000 00 00',
    map: { exists: true, profileCompleteness: 75 },
  });

  assert.equal(result.primaryOpportunity, 'missing_website');
  assert.ok(result.potentialScore >= 90);
  assert.equal(result.audit.seoScore, 0);
});

test('SSRF koruması yerel ve özel ağları reddeder', () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true);
  assert.equal(isPrivateAddress('10.10.2.4'), true);
  assert.equal(isPrivateAddress('192.168.1.20'), true);
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
});
