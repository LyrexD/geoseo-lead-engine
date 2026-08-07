import React from 'react';
import {
  Radar,
  Kanban,
  BarChart3,
  Globe,
  Plus,
  TrendingUp,
  Sparkles,
  MapPin,
  AlertTriangle,
  Building2
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'radar' | 'crm' | 'scanner';
  setActiveTab: (tab: 'dashboard' | 'radar' | 'crm' | 'scanner') => void;
  onOpenAddModal: () => void;
  onOpenLiveScanner: () => void;
  stats: {
    totalProspects: number;
    highPriorityCount: number;
    proposalsSent: number;
    totalPotentialRevenue: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenLiveScanner,
  stats,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Agency Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Radar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  GeoSEO Scout
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  GEO & Maps CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Web, SEO & AI Search Müşteri Bulma ve Analiz Paneli
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Özet Panel</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'radar'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>Müşteri Radarı & Harita</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'crm'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>CRM Süreç Takibi</span>
              {stats.proposalsSent > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {stats.proposalsSent}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'scanner'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Canlı Domain Tara</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenLiveScanner}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Canlı Site Analiz Et</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Yeni Potansiyel Ekle</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 p-1 ${
              activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Özet</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex flex-col items-center space-y-1 p-1 ${
              activeTab === 'radar' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Radar</span>
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center space-y-1 p-1 ${
              activeTab === 'crm' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>CRM</span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center space-y-1 p-1 ${
              activeTab === 'scanner' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Tarayıcı</span>
          </button>
        </div>

        {/* Key Metrics Ticker Banner */}
        <div className="py-2.5 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Kayıtlı Müşteri:</span>
            <span className="font-bold text-white">{stats.totalProspects} Firma</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Yüksek Fırsat:</span>
            <span className="font-bold text-amber-400">{stats.highPriorityCount} Acil İhtiyaç</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">Haritada Olmayan:</span>
            <span className="font-bold text-white">
              {stats.highPriorityCount} Adet
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Potansiyel Hacim:</span>
            <span className="font-bold text-emerald-400">
              ₺{stats.totalPotentialRevenue.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
