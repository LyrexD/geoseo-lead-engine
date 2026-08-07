import React, { useState } from 'react';
import { isArchivedProspectStatus, Prospect, ProspectStatus } from '../types';
import {
  Phone,
  MessageSquare,
  FileText,
  Plus,
  Sparkles,
  Building2,
  DollarSign,
  Columns,
  List,
  Filter,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Archive,
  UsersRound
} from 'lucide-react';

interface CRMPipelineProps {
  prospects: Prospect[];
  onUpdateProspectStatus: (id: string, newStatus: ProspectStatus) => void;
  onSelectProspect: (prospect: Prospect) => void;
  onAddNote: (id: string, noteText: string) => void;
}

export const CRMPipeline: React.FC<CRMPipelineProps> = ({
  prospects: allProspects,
  onUpdateProspectStatus,
  onSelectProspect,
  onAddNote,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'table'>('kanban');
  const [listScope, setListScope] = useState<'active' | 'archive'>('active');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [activeNoteProspectId, setActiveNoteProspectId] = useState<string | null>(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  const ACTIVE_STAGES: { id: ProspectStatus; label: string; color: string; bgBadge: string }[] = [
    { id: 'new', label: 'Yeni Potansiyel', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', bgBadge: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'audited', label: 'Analiz Edildi', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10', bgBadge: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'proposal_sent', label: 'Teklif Gönderildi', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', bgBadge: 'bg-amber-500/20 text-amber-300' },
    { id: 'negotiating', label: 'Görüşmede', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', bgBadge: 'bg-purple-500/20 text-purple-300' },
    { id: 'won', label: 'Kazanıldı', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', bgBadge: 'bg-emerald-500/20 text-emerald-300' },
  ];
  const ARCHIVE_STAGES: { id: ProspectStatus; label: string; color: string; bgBadge: string }[] = [
    { id: 'lost', label: 'Kaybedildi', color: 'border-slate-700 text-slate-400 bg-slate-800', bgBadge: 'bg-slate-800 text-slate-400' },
    { id: 'closed', label: 'İşletme Kapalı', color: 'border-red-500/30 text-red-300 bg-red-500/10', bgBadge: 'bg-red-500/15 text-red-300' },
  ];
  const activeProspects = allProspects.filter(
    (prospect) => !isArchivedProspectStatus(prospect.status),
  );
  const archivedProspects = allProspects.filter((prospect) =>
    isArchivedProspectStatus(prospect.status),
  );
  const prospects = listScope === 'active' ? activeProspects : archivedProspects;
  const STAGES = listScope === 'active' ? ACTIVE_STAGES : ARCHIVE_STAGES;

  const changeListScope = (scope: 'active' | 'archive') => {
    setListScope(scope);
    setSelectedStageFilter('all');
  };

  const handleNoteSubmit = (prospectId: string) => {
    if (!newNoteInput.trim()) return;
    onAddNote(prospectId, newNoteInput.trim());
    setNewNoteInput('');
    setActiveNoteProspectId(null);
  };

  const filteredProspects = selectedStageFilter === 'all'
    ? prospects
    : prospects.filter(p => p.status === selectedStageFilter);

  // Render Card Component with relaxed spacing
  const renderProspectCard = (prospect: Prospect, compact = false) => {
    return (
      <div
        key={prospect.id}
        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg space-y-3 transition-all group flex flex-col justify-between"
      >
        <div className="space-y-2.5">
          {/* Top Row: Business Name & Overall Score */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <h4
                onClick={() => onSelectProspect(prospect)}
                className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                title={prospect.businessName}
              >
                {prospect.businessName}
              </h4>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span>{prospect.industry}</span>
                <span>•</span>
                <span>{prospect.city}</span>
              </p>
            </div>

            <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 border ${
              prospect.audit.overallScore < 40
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {prospect.audit.overallScore}/100
            </span>
          </div>

          {/* Critical Opportunity Tag */}
          <div className="text-[11px] bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Kritik Eksiklik:</span>
            <span className="text-red-400 font-medium line-clamp-1">
              {prospect.audit.criticalFlaws[0] || 'Tasarım ve GEO güncellenmeli'}
            </span>
          </div>

          {/* Value & Contact Summary */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Sözleşme Değeri</span>
              <span className="font-extrabold text-emerald-400">₺{prospect.estimatedContractValue.toLocaleString('tr-TR')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Telefon</span>
              <span className="text-slate-300 font-medium truncate block">{prospect.phone}</span>
            </div>
          </div>

          {/* Note Snippet */}
          {prospect.notes.length > 0 && (
            <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
              "{prospect.notes[prospect.notes.length - 1]}"
            </div>
          )}

          {/* Quick Note Editor */}
          {activeNoteProspectId === prospect.id ? (
            <div className="space-y-1.5 pt-1">
              <textarea
                placeholder="Özel not ekleyin..."
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                rows={2}
              />
              <div className="flex justify-end space-x-1.5">
                <button
                  onClick={() => setActiveNoteProspectId(null)}
                  className="text-xs text-slate-400 px-2.5 py-1 hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleNoteSubmit(prospect.id)}
                  className="text-xs bg-emerald-500 text-slate-950 px-3 py-1 rounded-md font-bold hover:bg-emerald-400"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveNoteProspectId(prospect.id)}
              className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition-colors pt-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Not Ekle</span>
            </button>
          )}
        </div>

        {/* Card Actions Bottom Area */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          {/* Outreach Action Buttons Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5">
              <a
                href={`https://wa.me/90${prospect.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Merhaba ${prospect.businessName} yetkilisi, Google Maps ve web sitenizdeki dijital eksiklikler ve GEO görünürlük analiz raporunuz hazırlandı.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors flex items-center space-x-1"
                title="WhatsApp Mesajı"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">WP</span>
              </a>

              <a
                href={`tel:${prospect.phone}`}
                className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors flex items-center space-x-1"
                title="Ara"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Ara</span>
              </a>

              <button
                onClick={() => onSelectProspect(prospect)}
                className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors flex items-center space-x-1"
                title="AI Teklif"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Teklif</span>
              </button>
            </div>
          </div>

          {/* Full Width Stage Change Control */}
          <div className="w-full">
            <select
              value={prospect.status}
              onChange={(e) => onUpdateProspectStatus(prospect.id, e.target.value as ProspectStatus)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="new">📍 Yeni Potansiyel</option>
              <option value="audited">🔍 Analiz Edildi</option>
              <option value="proposal_sent">📄 Teklif Gönderildi</option>
              <option value="negotiating">💬 Görüşmede</option>
              <option value="won">🎉 Kazanıldı</option>
              <option value="lost">✕ Kaybedildi</option>
              <option value="closed">⛔ İşletme Kapalı</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            {listScope === 'active' ? (
              <Building2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Archive className="w-5 h-5 text-slate-400" />
            )}
            <span>
              {listScope === 'active'
                ? 'CRM Satış ve Müşteri Takip Süreci'
                : 'Kaybedilen ve Kapalı İşletmeler'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {listScope === 'active'
              ? 'Aktif müşteri adaylarının satış aşamalarını düzenleyin, teklif oluşturun ve doğrudan iletişime geçin.'
              : 'Satış sürecinden çıkarılan kayıtları inceleyin veya durumlarını değiştirerek tekrar aktif listeye alın.'}
          </p>
        </div>

        {/* Top Controls: View Switcher & Revenue Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              onClick={() => changeListScope('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                listScope === 'active'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UsersRound className="w-4 h-4" />
              <span>Aktif Adaylar</span>
              <span className="opacity-75">({activeProspects.length})</span>
            </button>

            <button
              onClick={() => changeListScope('archive')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                listScope === 'archive'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Pasif Liste</span>
              <span className="opacity-75">({archivedProspects.length})</span>
            </button>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Kanban Pano</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtreli Kartlar</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Tablo</span>
            </button>
          </div>

          {/* Portfolio Metrics */}
          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            {listScope === 'active' ? (
              <>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Görüşmede</span>
                  <span className="font-extrabold text-amber-400 text-xs">
                    ₺{activeProspects.filter(p => p.status === 'proposal_sent' || p.status === 'negotiating').reduce((a, b) => a + b.estimatedContractValue, 0).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Kazanılan</span>
                  <span className="font-extrabold text-emerald-400 text-xs">
                    ₺{activeProspects.filter(p => p.status === 'won').reduce((a, b) => a + b.estimatedContractValue, 0).toLocaleString('tr-TR')}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Kaybedildi</span>
                  <span className="font-extrabold text-slate-300 text-xs">
                    {archivedProspects.filter(p => p.status === 'lost').length} kayıt
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">İşletme Kapalı</span>
                  <span className="font-extrabold text-red-300 text-xs">
                    {archivedProspects.filter(p => p.status === 'closed').length} kayıt
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Spacious Horizontal Scrolling Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4 pt-1">
          <div
            className="flex space-x-4"
            style={{ minWidth: `${STAGES.length * 316}px` }}
          >
            {STAGES.map((stage) => {
              const stageProspects = prospects.filter((p) => p.status === stage.id);
              const stageTotalVal = stageProspects.reduce((sum, p) => sum + p.estimatedContractValue, 0);

              return (
                <div
                  key={stage.id}
                  className="w-[300px] min-w-[300px] bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-[750px] shadow-xl shrink-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ({stageProspects.length})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      ₺{(stageTotalVal / 1000).toFixed(0)}k
                    </span>
                  </div>

                  {/* Cards Vertical Scroll area */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {stageProspects.map((prospect) => renderProspectCard(prospect))}

                    {stageProspects.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl space-y-1">
                        <span>Bu aşamada firma yok</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Filtered Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Stage Filter Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
            <button
              onClick={() => setSelectedStageFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedStageFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tüm Aşamalar ({prospects.length})
            </button>

            {STAGES.map((s) => {
              const count = prospects.filter(p => p.status === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStageFilter(s.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                    selectedStageFilter === s.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid (1 to 3 spacious columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProspects.map((prospect) => renderProspectCard(prospect))}

            {filteredProspects.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
                Seçilen filtrelere uygun müşteri adayı bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: Detailed Table View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4">İşletme Adı & Konum</th>
                  <th className="p-4">Sağlık Skoru</th>
                  <th className="p-4">Kritik Eksiklik</th>
                  <th className="p-4">Sözleşme Değeri</th>
                  <th className="p-4">Aşama / Durum</th>
                  <th className="p-4 text-right">Hızlı İletişim & İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <div
                        onClick={() => onSelectProspect(prospect)}
                        className="font-bold text-sm text-white hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {prospect.businessName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {prospect.industry} • {prospect.city}, {prospect.district}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        prospect.audit.overallScore < 40
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {prospect.audit.overallScore} / 100
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      <span className="text-red-300 font-medium truncate block">
                        {prospect.audit.criticalFlaws[0] || 'Tasarım / SEO eksikliği'}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-emerald-400 text-sm">
                      ₺{prospect.estimatedContractValue.toLocaleString('tr-TR')}
                    </td>

                    <td className="p-4">
                      <select
                        value={prospect.status}
                        onChange={(e) => onUpdateProspectStatus(prospect.id, e.target.value as ProspectStatus)}
                        className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        <option value="new">Yeni Potansiyel</option>
                        <option value="audited">Analiz Edildi</option>
                        <option value="proposal_sent">Teklif Gönderildi</option>
                        <option value="negotiating">Görüşmede</option>
                        <option value="won">Kazanıldı 🎉</option>
                        <option value="lost">Kaybedildi ✕</option>
                        <option value="closed">İşletme Kapalı ⛔</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`https://wa.me/90${prospect.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-semibold transition-colors flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${prospect.phone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white font-semibold transition-colors flex items-center space-x-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Ara</span>
                        </a>

                        <button
                          onClick={() => onSelectProspect(prospect)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-semibold transition-colors flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Teklif</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
