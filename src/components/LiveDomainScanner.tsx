import React, { useState } from 'react';
import { ComprehensiveAudit, OpportunityType, Prospect } from '../types';
import {
  Globe,
  Search,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Smartphone,
  Bot,
  MapPin,
  FileCode,
  TrendingDown,
  PlusCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface LiveDomainScannerProps {
  onSaveToCrm: (newProspect: Prospect) => void;
}

interface ScanAnalysis {
  primaryOpportunity: OpportunityType;
  secondaryOpportunities: OpportunityType[];
  estimatedContractValue: number;
  potentialScore: number;
  reasons: string[];
}

export const LiveDomainScanner: React.FC<LiveDomainScannerProps> = ({ onSaveToCrm }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [industryInput, setIndustryInput] = useState('Diş Hekimi / Sağlık');
  const [cityInput, setCityInput] = useState('İstanbul');
  const [districtInput, setDistrictInput] = useState('Kadıköy');
  const [phoneInput, setPhoneInput] = useState('0216 111 22 33');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [auditResult, setAuditResult] = useState<{
    url: string;
    audit: ComprehensiveAudit;
    analysis: ScanAnalysis;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setAuditResult(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/audit/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          businessName: businessNameInput,
          industry: industryInput,
          city: cityInput,
          district: districtInput,
          phone: phoneInput,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Domain taranırken sunucu hatası oluştu.');
      }

      setAuditResult({ url: data.url, audit: data.audit, analysis: data.analysis });

      // Auto-populate business name if missing
      if (!businessNameInput) {
        const domainName = data.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
        setBusinessNameInput(domainName.charAt(0).toUpperCase() + domainName.slice(1));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Domain analizi yapılırken beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProspect = () => {
    if (!auditResult) return;

    const newProspect: Prospect = {
      id: 'prospect-' + Date.now(),
      businessName: businessNameInput || 'Taranan İşletme',
      industry: industryInput,
      city: cityInput,
      district: districtInput,
      address: `${districtInput}, ${cityInput}`,
      phone: phoneInput,
      email: '',
      websiteUrl: auditResult.url,
      lat: 0,
      lng: 0,
      primaryOpportunity: auditResult.analysis.primaryOpportunity,
      secondaryOpportunities: auditResult.analysis.secondaryOpportunities,
      status: 'audited',
      audit: auditResult.audit,
      notes: [`Taranan URL: ${auditResult.url}`, `AI Özet: ${auditResult.audit.aiRecommendationSummary}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedContractValue: auditResult.analysis.estimatedContractValue,
      discovery: {
        provider: 'domain_audit',
        sourceId: auditResult.url,
        sourceUrl: auditResult.url,
        discoveredAt: new Date().toISOString(),
        potentialScore: auditResult.analysis.potentialScore,
        reasons: auditResult.analysis.reasons,
      },
    };

    onSaveToCrm(newProspect);
    setIsSaved(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Canlı Web Sitesi, SEO ve GEO (AI Search) Analiz Aracı
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              İstediğiniz alan adını girin; sunucumuz sitenin HTML yapısını, mobil uyumluluğunu, SSL sertifikasını ve GEO (yapay zeka arama motoru) hazırlığını kanıta dayalı kurallarla canlı olarak tarasın.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRunScan} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Örn: www.ornek-dis-klinigi.com veya firma-domain.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-50 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Site Taranıyor ve Sinyaller Puanlanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Canlı Analizi Başlat</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Audit Report Results Display */}
      {auditResult && (
        <div className="space-y-6">
          {/* Top Overall Score Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Analiz Tamamlandı
                </span>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2 mt-0.5">
                  <span>{auditResult.url}</span>
                  <a href={auditResult.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </h3>
              </div>

              {!isSaved ? (
                <button
                  onClick={handleSaveProspect}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>CRM Müşteri Adaylarına Ekle</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CRM'e Eklendi</span>
                </span>
              )}
            </div>

            {/* Business info fields for saving */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Firma / İşletme Adı:</label>
                <input
                  type="text"
                  value={businessNameInput}
                  onChange={(e) => setBusinessNameInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Sektör:</label>
                <input
                  type="text"
                  value={industryInput}
                  onChange={(e) => setIndustryInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Şehir & İlçe:</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    value={districtInput}
                    onChange={(e) => setDistrictInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Score Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Genel Uyumluluk</span>
                <div className={`text-2xl font-black ${auditResult.audit.overallScore < 40 ? 'text-red-400' : 'text-amber-400'}`}>
                  {auditResult.audit.overallScore}/100
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">HTML5 / Mobil</span>
                <div className="text-2xl font-black text-indigo-400">
                  {auditResult.audit.technicalScore}/100
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Arama Motoru (SEO)</span>
                <div className="text-2xl font-black text-cyan-400">
                  {auditResult.audit.seoScore}/100
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">GEO (Yapay Zeka)</span>
                <div className="text-2xl font-black text-purple-400">
                  {auditResult.audit.geoScore}/100
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Aylık Tahmini Kayıp</span>
                <div className="text-xl font-black text-red-400">
                  ₺{auditResult.audit.estimatedMonthlyLeadLoss?.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>

            {/* Technical Signal Check Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>HTML5 & Altyapı Sinyalleri</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-center justify-between">
                    <span>HTML5 Doctype Uyumu:</span>
                    {auditResult.audit.technical.isHtml5Valid ? (
                      <span className="text-emerald-400 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Var</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center"><XCircle className="w-3.5 h-3.5 mr-1" /> Eksik (Eski Yapı)</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Mobil Viewport Meta:</span>
                    {auditResult.audit.technical.hasViewportMeta ? (
                      <span className="text-emerald-400 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Uyumlu</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center"><XCircle className="w-3.5 h-3.5 mr-1" /> Bozuk (Mobilde Taşar)</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>SSL Güvenlik Sertifikası:</span>
                    {auditResult.audit.technical.hasSsl ? (
                      <span className="text-emerald-400 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> HTTPS</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center"><XCircle className="w-3.5 h-3.5 mr-1" /> HTTP (Güvensiz)</span>
                    )}
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>SEO ve Başlık Hiyerarşisi</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-center justify-between">
                    <span>Sayfa Başlığı (Title):</span>
                    <span className="text-slate-200 truncate max-w-[140px]">{auditResult.audit.seo.title || 'Yok'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Meta Açıklama (Desc):</span>
                    {auditResult.audit.seo.hasMetaDescription ? (
                      <span className="text-emerald-400 font-bold">Mevcut</span>
                    ) : (
                      <span className="text-red-400 font-bold">Eksik</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>H1 Ana Başlık:</span>
                    {auditResult.audit.seo.hasH1 ? (
                      <span className="text-emerald-400 font-bold">Var</span>
                    ) : (
                      <span className="text-red-400 font-bold font-mono">H1 Yok</span>
                    )}
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center space-x-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>GEO / AI Arama Görünürlüğü</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-center justify-between">
                    <span>JSON-LD Şeması:</span>
                    {auditResult.audit.geo.hasJsonLd ? (
                      <span className="text-emerald-400 font-bold">TANIMLI</span>
                    ) : (
                      <span className="text-purple-400 font-bold">YAPISAL VERİ YOK</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>LocalBusiness Schema:</span>
                    {auditResult.audit.geo.hasLocalBusinessSchema ? (
                      <span className="text-emerald-400 font-bold">Var</span>
                    ) : (
                      <span className="text-amber-400 font-bold">İşletme Şeması Eksik</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between">
                    <span>AI Arama Hazırlık Derecesi:</span>
                    <span className="text-purple-300 font-bold">{auditResult.audit.geo.aiSearchVisibilityGrade} Sınıfı</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AI Strategic Assessment Summary */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/20 p-4 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Algoritmik Stratejik Değerlendirme Raporu:</span>
              </span>
              <p className="text-slate-300 leading-relaxed italic">
                "{auditResult.audit.aiRecommendationSummary}"
              </p>
            </div>

            {/* Critical Flaws & Quick Fixes lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-red-500/20 space-y-2 text-xs">
                <h4 className="font-bold text-red-400 flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Tespit Edilen Kritik Hatalar ({auditResult.audit.criticalFlaws.length})</span>
                </h4>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {auditResult.audit.criticalFlaws.map((flaw, idx) => (
                    <li key={idx} className="text-slate-300">{flaw}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ajans İyileştirme Planı ({auditResult.audit.quickFixes.length})</span>
                </h4>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {auditResult.audit.quickFixes.map((fix, idx) => (
                    <li key={idx} className="text-slate-300">{fix}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
