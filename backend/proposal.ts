import type { ProposalOutput, Prospect } from '../src/types';
import { formatTry } from './utils';

interface ServiceBlueprint {
  category: string;
  impact: string;
  solution: string;
}

const BLUEPRINTS: Array<{ pattern: RegExp; value: ServiceBlueprint }> = [
  {
    pattern: /web sitesi|erişilebilir|http|tls|dns/i,
    value: {
      category: 'Web Altyapısı',
      impact: 'Ziyaretçiler işletmenin hizmetlerine ve iletişim kanallarına güvenle ulaşamaz.',
      solution: 'Hızlı, erişilebilir ve mobil öncelikli web altyapısı kurmak.',
    },
  },
  {
    pattern: /mobil|viewport|responsive/i,
    value: {
      category: 'Mobil Deneyim',
      impact: 'Mobil aramalardan gelen yüksek niyetli ziyaretçiler dönüşümden önce ayrılabilir.',
      solution: 'Mobile-first düzen, okunabilir tipografi ve tek dokunuşlu iletişim akışı kurmak.',
    },
  },
  {
    pattern: /json-ld|schema|yapılandırılmış|localbusiness/i,
    value: {
      category: 'GEO ve Yapılandırılmış Veri',
      impact: 'Arama ve yanıt motorları işletme, hizmet ve konum ilişkisini daha zor doğrular.',
      solution: 'Doğrulanabilir NAP verisiyle işletme türüne özel Schema.org işaretlemesi eklemek.',
    },
  },
  {
    pattern: /seo|başlık|h1|açıklama/i,
    value: {
      category: 'Yerel SEO',
      impact: 'Hizmet ve konum niyetli aramalarda alaka sinyalleri zayıf kalır.',
      solution: 'Hizmet-konum sayfaları ile title, description ve başlık mimarisini yenilemek.',
    },
  },
  {
    pattern: /robots|ai tarayıcı/i,
    value: {
      category: 'AI Arama Erişimi',
      impact: 'İzin verilen içerik, yanıt motorlarının tarama katmanına ulaşamayabilir.',
      solution: 'robots.txt kurallarını içerik politikası ve görünürlük hedefleriyle uyumlu hale getirmek.',
    },
  },
  {
    pattern: /harita|puan|yorum/i,
    value: {
      category: 'Harita ve İtibar',
      impact: 'Yerel aramalarda güven ve seçim oranı düşebilir.',
      solution: 'Profil bütünlüğü, kategori doğruluğu ve yorum yanıtlama sürecini iyileştirmek.',
    },
  },
];

function blueprintFor(issue: string): ServiceBlueprint {
  return (
    BLUEPRINTS.find(({ pattern }) => pattern.test(issue))?.value ?? {
      category: 'Dijital Görünürlük',
      impact: 'İşletmenin bulunabilirliği ve dönüşüm ölçümü sınırlı kalır.',
      solution: 'Sorunu ölçülebilir teknik ve içerik iyileştirmeleriyle gidermek.',
    }
  );
}

function roundedPrice(value: number): number {
  return Math.max(8_000, Math.round(value / 500) * 500);
}

function priceLabel(value: number): string {
  return `${formatTry(roundedPrice(value))} TL + KDV`;
}

export function generateProposal(
  prospect: Prospect,
  agencyName = 'GeoSEO Scout Dijital Ajans',
): ProposalOutput {
  const flaws = prospect.audit.criticalFlaws.slice(0, 4);
  const highlights = flaws.map((issue) => {
    const blueprint = blueprintFor(issue);
    return {
      category: blueprint.category,
      issue,
      impact: blueprint.impact,
      solution: blueprint.solution,
    };
  });
  const basePrice = Math.max(18_000, prospect.estimatedContractValue || 30_000);
  const location = [prospect.district, prospect.city].filter(Boolean).join(', ');
  const firstIssue = flaws[0] || 'yerel dijital görünürlük eksikleri';

  return {
    title: `${prospect.businessName} Dijital Görünürlük ve Dönüşüm Planı`,
    executiveSummary: `${prospect.businessName} için yapılan kanıta dayalı taramada dijital sağlık skoru ${prospect.audit.overallScore}/100 olarak hesaplandı. Öncelikli bulgu: ${firstIssue} Tahmini fırsat büyüklüğü, sektör profili ve ölçülen görünürlük açığı birlikte değerlendirilerek aylık ${formatTry(prospect.audit.estimatedMonthlyLeadLoss)} TL seviyesinde modellenmiştir; bu değer garanti değil, önceliklendirme tahminidir.\n\n${agencyName}, ilk aşamada ölçüm altyapısını ve kritik teknik sorunları düzeltir; ardından yerel SEO, yapılandırılmış veri ve dönüşüm akışlarını geliştirir. Başarı; sıralama vaadi yerine organik görünürlük, nitelikli arama/mesaj, form dönüşümü ve edinme maliyeti göstergeleriyle raporlanır.`,
    auditHighlights: highlights,
    proposedServices: [
      {
        packageName: 'Temel Görünürlük',
        price: priceLabel(basePrice * 0.65),
        features: [
          'Kritik teknik ve mobil düzeltmeler',
          'Temel yerel SEO başlık yapısı',
          'İletişim ve dönüşüm ölçümü',
          'Harita profil bütünlüğü kontrolü',
        ],
        timeline: '7-10 İş Günü',
      },
      {
        packageName: 'GEO + Yerel Büyüme',
        price: priceLabel(basePrice),
        features: [
          'Temel Görünürlük paketinin tamamı',
          'İşletme türüne özel JSON-LD mimarisi',
          'Hizmet ve konum açılış sayfaları',
          'AI tarayıcı ve entity sinyali kontrolleri',
          '30 günlük performans izleme',
        ],
        timeline: '15-20 İş Günü',
      },
      {
        packageName: 'Bölgesel Talep Motoru',
        price: priceLabel(basePrice * 1.6),
        features: [
          'GEO + Yerel Büyüme paketinin tamamı',
          'Çoklu hizmet/konum içerik planı',
          'CRM dönüşüm ve kaynak takibi',
          'İtibar ve yorum operasyonu',
          '90 günlük test ve optimizasyon döngüsü',
        ],
        timeline: '8-12 Hafta',
      },
    ],
    expectedResults: [
      'Teknik tarama hatalarının ve mobil erişim engellerinin azaltılması',
      `${location || 'Hedef bölgede'} hizmet-konum alaka sinyallerinin güçlenmesi`,
      'Arama motorları için doğrulanabilir işletme verisi bütünlüğü',
      'Telefon, WhatsApp ve form dönüşümlerinin kaynak bazında ölçülebilmesi',
    ],
    coldEmailTemplate: {
      subject: `${prospect.businessName} için ${prospect.audit.overallScore}/100 görünürlük analizi`,
      body: `Merhaba ${prospect.businessName} yetkilisi,\n\n${location || 'bölgenizde'} yaptığımız işletme taramasında web ve yerel görünürlük tarafında ölçülebilir bir geliştirme alanı tespit ettik: ${firstIssue}\n\nKısa raporda mevcut skoru, kanıtları ve ilk 3 iyileştirme adımını hazırladık. Uygun olursanız 15 dakikalık bir görüşmede raporu paylaşabilirim.\n\nSaygılarımla,\n${agencyName}`,
    },
    whatsappMessage: `Merhaba ${prospect.businessName} yetkilisi. ${location || 'bölgeniz'} için yaptığımız dijital görünürlük taramasında ${prospect.audit.overallScore}/100 skor ve “${firstIssue}” bulgusunu tespit ettik. Kanıtları ve kısa iyileştirme planını ücretsiz paylaşmamızı ister misiniz? — ${agencyName}`,
    callScript: `1. İzin: “${prospect.businessName} için hazırladığımız kısa görünürlük taraması hakkında iki dakika bilgi verebilir miyim?”\n2. Kanıt: “Ölçülen skor ${prospect.audit.overallScore}/100; öncelikli bulgu ${firstIssue}.”\n3. İhtiyaç: “Web veya harita üzerinden gelen yeni müşteri taleplerini şu anda nasıl ölçüyorsunuz?”\n4. Sonraki adım: “Kanıtları ekranda göstereceğimiz 15 dakikalık bir değerlendirme planlayalım; ardından kapsam ve bütçeyi birlikte netleştiririz.”`,
  };
}
