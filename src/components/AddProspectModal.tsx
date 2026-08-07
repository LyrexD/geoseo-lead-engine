import React, { useState } from 'react';
import { Prospect, OpportunityType } from '../types';
import { X, Building2, MapPin, Phone, Globe, Plus } from 'lucide-react';

interface AddProspectModalProps {
  onClose: () => void;
  onAddProspect: (prospect: Prospect) => void;
}

export const AddProspectModal: React.FC<AddProspectModalProps> = ({
  onClose,
  onAddProspect,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Diş Hekimi / Sağlık');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('0216 ');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [primaryOpportunity, setPrimaryOpportunity] = useState<OpportunityType>('no_maps');
  const [contractValue, setContractValue] = useState('30000');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    const newProspect: Prospect = {
      id: 'prospect-' + Date.now(),
      businessName: businessName.trim(),
      industry,
      city,
      district,
      address: address || `${district}, ${city}`,
      phone: phone.trim(),
      email: email.trim(),
      websiteUrl: websiteUrl.trim(),
      lat: 0,
      lng: 0,
      primaryOpportunity,
      secondaryOpportunities: ['outdated_html'],
      status: 'new',
      estimatedContractValue: parseInt(contractValue) || 30000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: note ? [note] : ['Sisteme manuel olarak kaydedildi.'],
      audit: {
        overallScore: primaryOpportunity === 'no_maps' ? 30 : 45,
        technicalScore: 40,
        seoScore: 40,
        geoScore: 20,
        mapsScore: primaryOpportunity === 'no_maps' ? 0 : 50,
        technical: {
          isHtml5Valid: false,
          hasViewportMeta: primaryOpportunity !== 'non_mobile',
          hasSsl: true,
          hasSemanticTags: false,
          hasTableLayout: false,
          loadingSpeedSec: 4.5,
        },
        seo: {
          title: businessName,
          hasTitle: true,
          titleLength: businessName.length,
          metaDescription: '',
          hasMetaDescription: false,
          hasOpenGraph: false,
          hasH1: false,
          imageAltRatio: 20,
        },
        geo: {
          hasJsonLd: primaryOpportunity !== 'no_geo_schema',
          hasLocalBusinessSchema: false,
          hasNapData: true,
          isAiBotAllowed: true,
          geoCoordinatesFound: false,
          nlpEntityClarityScore: 30,
          aiSearchVisibilityGrade: 'D',
        },
        maps: {
          existsOnMaps: primaryOpportunity !== 'no_maps',
          isClaimed: false,
          rating: 0,
          reviewCount: 0,
          hasOwnerResponses: false,
          categoryMatched: true,
          isVerified: primaryOpportunity === 'no_maps',
          dataSource: 'manual',
        },
        criticalFlaws: [
          primaryOpportunity === 'no_maps'
            ? 'Google Maps kaydı bulunmamaktadır'
            : primaryOpportunity === 'non_mobile'
            ? 'Mobil duyarlılık (viewport) sorunları mevcut'
            : 'GEO ve Yapay zeka arama motorları için JSON-LD şeması yok',
          'HTML5 semantik etiket yapısı güncellenmeli',
        ],
        quickFixes: [
          'Google Haritalar kaydı ve doğrulama',
          'Mobil uyumlu responsive tasarım güncellenmesi',
          'LocalBusiness JSON-LD schema entegrasyonu',
        ],
        estimatedMonthlyLeadLoss: 0,
        aiRecommendationSummary: `${businessName} manuel olarak kaydedildi. Kesin puan ve fırsat tahmini için canlı domain ve harita doğrulaması çalıştırılmalıdır.`,
      },
      discovery: {
        provider: 'manual',
        discoveredAt: new Date().toISOString(),
        potentialScore: 0,
        reasons: ['Manuel olarak eklenen, henüz doğrulanmamış kayıt'],
      },
    };

    onAddProspect(newProspect);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Yeni Potansiyel Müşteri Ekle</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">İşletme / Firma Adı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Özgür Diş Kliniği Kadıköy"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Sektör</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Şehir</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">İlçe</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Web Sitesi URL (Opsiyonel)</label>
            <input
              type="text"
              placeholder="https://firma-ornek.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Ana Tespit Edilen Fırsat</label>
              <select
                value={primaryOpportunity}
                onChange={(e) => setPrimaryOpportunity(e.target.value as OpportunityType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="no_maps">📍 Google Maps Kaydı Yok</option>
                <option value="non_mobile">📱 Mobil Uyumsuz (Bozuk)</option>
                <option value="no_geo_schema">🤖 GEO / AI Arama Eksik</option>
                <option value="missing_website">🌐 Web Sitesi Olmayanlar</option>
                <option value="low_rating">⭐ Düşük Puanlı Maps Profil</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tahmini Ajans Sözleşme Değeri (TL)</label>
              <input
                type="number"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">İlk İnceleme Notu</label>
            <textarea
              placeholder="Müşteri hakkındaki ilk izlenimler..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
            >
              CRM'e Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
