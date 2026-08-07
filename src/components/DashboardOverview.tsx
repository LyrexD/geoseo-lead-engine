import React from 'react';
import { Prospect } from '../types';
import {
  Building2,
  AlertOctagon,
  MapPinOff,
  Smartphone,
  Sparkles,
  Search,
  FileCheck2,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Bot
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface DashboardOverviewProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  onFilterByOpportunity: (type: string) => void;
  onNavigateToRadar: () => void;
  onNavigateToScanner: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  prospects,
  onSelectProspect,
  onFilterByOpportunity,
  onNavigateToRadar,
  onNavigateToScanner,
}) => {
  // Compute Key Metrics
  const totalCount = prospects.length;
  const noMapsCount = prospects.filter(
    p =>
      p.primaryOpportunity === 'no_maps' ||
      (p.audit.maps.isVerified !== false && !p.audit.maps.existsOnMaps),
  ).length;
  const nonMobileCount = prospects.filter(p => p.primaryOpportunity === 'non_mobile' || !p.audit.technical.hasViewportMeta).length;
  const noGeoCount = prospects.filter(p => p.primaryOpportunity === 'no_geo_schema' || !p.audit.geo.hasJsonLd).length;
  const missingWebCount = prospects.filter(p => !p.websiteUrl || p.primaryOpportunity === 'missing_website').length;

  const totalMonthlyLossDetected = prospects.reduce((acc, p) => acc + (p.audit.estimatedMonthlyLeadLoss || 0), 0);
  const totalPotentialContractVal = prospects.reduce((acc, p) => acc + (p.estimatedContractValue || 0), 0);

  // Chart Data: Opportunity Breakdown
  const opportunityData = [
    { name: "Maps Kaydı Yok", value: noMapsCount, color: "#f87171" },
    { name: "Mobil Uyumsuz", value: nonMobileCount, color: "#fbbf24" },
    { name: "GEO / AI Eksik", value: noGeoCount, color: "#c084fc" },
    { name: "Web Sitesi Yok", value: missingWebCount, color: "#38bdf8" },
  ];

  // Chart Data: Pipeline Status
  const statusCounts = {
    new: prospects.filter(p => p.status === 'new').length,
    audited: prospects.filter(p => p.status === 'audited').length,
    proposal_sent: prospects.filter(p => p.status === 'proposal_sent').length,
    negotiating: prospects.filter(p => p.status === 'negotiating').length,
    won: prospects.filter(p => p.status === 'won').length,
  };

  const statusData = [
    { status: 'Yeni Potansiyel', count: statusCounts.new, fill: '#38bdf8' },
    { status: 'Analiz Edildi', count: statusCounts.audited, fill: '#818cf8' },
    { status: 'Teklif Gönderildi', count: statusCounts.proposal_sent, fill: '#fbbf24' },
    { status: 'Görüşmede', count: statusCounts.negotiating, fill: '#f43f5e' },
    { status: 'Kazanıldı', count: statusCounts.won, fill: '#34d399' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Shortcuts */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>GEO & Local SEO Prospection Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ajans Müşteri Potansiyel ve Analiz Paneli
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Google Maps kaydı eksik, web sitesi mobil uyumsuz olan veya ChatGPT/Perplexity gibi yapay zeka arama motorlarında görünmeyen yerel işletmeleri tespit edin, anında SEO & GEO raporları ve otomatik teklifler oluşturun.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
            <button
              onClick={onNavigateToRadar}
              className="flex-1 lg:flex-initial flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Harita Radarında Ara</span>
            </button>

            <button
              onClick={onNavigateToScanner}
              className="flex-1 lg:flex-initial flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 text-xs transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Canlı URL Tara</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Toplam Potansiyel Müşteri</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalCount} İşletme</div>
          <p className="text-xs text-slate-400 mt-1">
            Bölgesel veritabanında taranmış firma
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Tespit Edilen Aylık Ciro Kaybı</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400">
            ₺{totalMonthlyLossDetected.toLocaleString('tr-TR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Web & Harita eksikleri nedeniyle kaybolan müşteri hacmi
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Harita & Mobil Uyarı Sayısı</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {noMapsCount + nonMobileCount} Firma
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maps yok veya mobil ekranı bozuluyor
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Ajans Teklif Hacmi</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₺{totalPotentialContractVal.toLocaleString('tr-TR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Potansiyel hizmet paket sözleşme değeri
          </p>
        </div>
      </div>

      {/* Quick Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onFilterByOpportunity('no_maps')}
          className="bg-slate-900/80 hover:bg-slate-800 border border-red-500/20 hover:border-red-500/40 p-4 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <MapPinOff className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              {noMapsCount}
            </span>
          </div>
          <div className="text-xs font-semibold text-white">Google Maps Eksik</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Haritada kaydı olmayanlar</p>
        </button>

        <button
          onClick={() => onFilterByOpportunity('non_mobile')}
          className="bg-slate-900/80 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Smartphone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {nonMobileCount}
            </span>
          </div>
          <div className="text-xs font-semibold text-white">Mobil Uyumsuz Siteler</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Viewport ve taşma hatası</p>
        </button>

        <button
          onClick={() => onFilterByOpportunity('no_geo_schema')}
          className="bg-slate-900/80 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-500/40 p-4 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Bot className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              {noGeoCount}
            </span>
          </div>
          <div className="text-xs font-semibold text-white">GEO / AI Eksik</div>
          <p className="text-[11px] text-slate-400 mt-0.5">ChatGPT/Perplexity görmüyor</p>
        </button>

        <button
          onClick={() => onFilterByOpportunity('missing_website')}
          className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/40 p-4 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {missingWebCount}
            </span>
          </div>
          <div className="text-xs font-semibold text-white">Web Sitesi Yok</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sadece harita kaydı var</p>
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Opportunity Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Müşteri Fırsat Dağılımı</h3>
              <p className="text-xs text-slate-400">Tespit edilen en yaygın eksiklik türleri</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={opportunityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {opportunityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {opportunityData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-300 font-medium">{item.name}:</span>
                <span className="text-white font-bold">{item.value} firma</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Pipeline Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">CRM Satış Hunisi (Pipeline)</h3>
              <p className="text-xs text-slate-400">Potansiyel müşterilerin aşamalara göre durumu</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="status" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top High Priority Prospects List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">En Yüksek Potansiyelli Müşteri Adayları</h3>
            <p className="text-xs text-slate-400">Anında iletişime geçilebilecek ve teklif sunulabilecek firmalar</p>
          </div>
          <button
            onClick={onNavigateToRadar}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
          >
            <span>Tümünü Gör</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {prospects.slice(0, 5).map((prospect) => (
            <div
              key={prospect.id}
              onClick={() => onSelectProspect(prospect)}
              className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-3 rounded-xl transition-all cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {prospect.businessName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {prospect.industry}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {prospect.city}, {prospect.district}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span>
                    Skor:{' '}
                    <strong className={`font-extrabold ${prospect.audit.overallScore < 40 ? 'text-red-400' : 'text-amber-400'}`}>
                      {prospect.audit.overallScore}/100
                    </strong>
                  </span>
                  <span>
                    Tahmini Ciro Kaybı:{' '}
                    <strong className="text-red-400">
                      ₺{prospect.audit.estimatedMonthlyLeadLoss?.toLocaleString('tr-TR')}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                  prospect.primaryOpportunity === 'no_maps'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : prospect.primaryOpportunity === 'non_mobile'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {prospect.primaryOpportunity === 'no_maps' ? 'Harita Yok' : prospect.primaryOpportunity === 'non_mobile' ? 'Mobil Bozuk' : 'GEO / AI Eksik'}
                </span>
                <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 transition-colors">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
