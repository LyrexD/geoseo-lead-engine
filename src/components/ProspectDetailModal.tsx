import React, { useEffect, useRef, useState } from 'react';
import { Prospect, ProposalOutput, ProspectStatus } from '../types';
import { ProposalViewerModal } from './ProposalViewerModal';
import {
  X,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  Mail,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldCheck,
  Loader2,
  FileText,
  Clock,
  MessageSquare,
  TrendingUp,
  SlidersHorizontal,
  Bot,
  ExternalLink
} from 'lucide-react';

interface ProspectDetailModalProps {
  prospect: Prospect;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: ProspectStatus) => void;
  onAddNote: (id: string, noteText: string) => void;
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  prospect,
  onClose,
  onUpdateStatus,
  onAddNote,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'proposal_gen'>('audit');
  const [noteInput, setNoteInput] = useState('');

  // Proposal State
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalOutput | null>(null);
  const [proposalError, setProposalError] = useState('');
  const [showProposalViewer, setShowProposalViewer] = useState(false);
  const markedAnalyzedProspectId = useRef<string | null>(null);

  useEffect(() => {
    if (
      prospect.status === 'new' &&
      markedAnalyzedProspectId.current !== prospect.id
    ) {
      markedAnalyzedProspectId.current = prospect.id;
      onUpdateStatus(prospect.id, 'audited');
    }
  }, [onUpdateStatus, prospect.id, prospect.status]);

  const handleGenerateProposal = async () => {
    setIsGeneratingProposal(true);
    setProposalError('');

    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect: prospect,
          agencyName: 'GeoSEO Scout Dijital Ajans',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Teklif üretilirken bir sorun yaşandı.');
      }

      setProposalData(data.proposal);
    } catch (err: any) {
      setProposalError(err.message || 'Teklif taslağı üretilirken bir hata oluştu.');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(prospect.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {prospect.industry}
              </span>
              <span className="text-xs text-slate-400">• {prospect.city}, {prospect.district}</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>{prospect.businessName}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Selector */}
            <select
              value={prospect.status}
              onChange={(e) => onUpdateStatus(prospect.id, e.target.value as ProspectStatus)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="new">Yeni Potansiyel</option>
              <option value="audited">Analiz Edildi</option>
              <option value="proposal_sent">Teklif Gönderildi</option>
              <option value="negotiating">Görüşmede</option>
              <option value="won">Kazanıldı 🎉</option>
              <option value="lost">Kaybedildi ✕</option>
              <option value="closed">İşletme Kapalı ⛔</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'audit'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Detaylı Analiz & Sağlık Karnesi</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal_gen')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'proposal_gen'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Akıllı Otomatik Teklif Üretici</span>
            {proposalData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {activeTab === 'audit' ? (
            <div className="space-y-6">
              {/* Business Overview & Contact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">İletişim & Adres</span>
                  <div className="text-white font-semibold flex items-center space-x-1.5 pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{prospect.phone}</span>
                  </div>
                  <div className="text-slate-300 truncate">{prospect.address}</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Web Varlığı</span>
                  <div className="text-white font-semibold flex items-center space-x-1.5 pt-0.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    {prospect.websiteUrl ? (
                      <a href={prospect.websiteUrl} target="_blank" rel="noreferrer" className="hover:underline text-cyan-300 truncate">
                        {prospect.websiteUrl}
                      </a>
                    ) : (
                      <span className="text-red-400">WEB SİTESİ YOK</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Harita Durumu & Puan</span>
                  <div className="text-white font-semibold flex items-center space-x-1.5 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {prospect.audit.maps.isVerified === false ? (
                      <span className="text-slate-400">HARİTA VERİSİ DOĞRULANMADI</span>
                    ) : prospect.audit.maps.existsOnMaps ? (
                      prospect.audit.maps.rating > 0 ? (
                        <span>⭐ {prospect.audit.maps.rating} / 5 ({prospect.audit.maps.reviewCount} Değerlendirme)</span>
                      ) : (
                        <span>Harita profili mevcut • Puan verisi yok</span>
                      )
                    ) : (
                      <span className="text-red-400 font-bold">HARİTA KAYDI YOK</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Badges Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Genel Skor</span>
                  <div className={`text-2xl font-extrabold mt-1 ${
                    prospect.audit.overallScore < 40 ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {prospect.audit.overallScore}/100
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">HTML5 & Mobil</span>
                  <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                    {prospect.audit.technicalScore}/100
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">GEO / AI Readiness</span>
                  <div className="text-2xl font-extrabold text-purple-400 mt-1">
                    {prospect.audit.geoScore}/100
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Tahmini Aylık Kayıp</span>
                  <div className="text-xl font-extrabold text-red-400 mt-1">
                    ₺{prospect.audit.estimatedMonthlyLeadLoss?.toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Critical Flaws and Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-red-500/20 space-y-2">
                  <h4 className="font-bold text-red-400 flex items-center space-x-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Tespit Edilen Kritik Hatalar</span>
                  </h4>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {prospect.audit.criticalFlaws.map((flaw, idx) => (
                      <li key={idx}>{flaw}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hızlı İyileştirme Adımları</span>
                  </h4>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {prospect.audit.quickFixes.map((fix, idx) => (
                      <li key={idx}>{fix}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Notes Timeline */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white">İç Görüşme Notları</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {prospect.notes.map((n, idx) => (
                    <div key={idx} className="bg-slate-900 p-2.5 rounded-lg text-slate-300 text-[11px] border border-slate-800">
                      • {n}
                    </div>
                  ))}
                  {prospect.notes.length === 0 && (
                    <div className="text-slate-400 italic">Henüz not eklenmedi.</div>
                  )}
                </div>

                <form onSubmit={handleNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Yeni not ekle..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs"
                  >
                    Ekle
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Proposal Generation Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Bulgulara Dayalı Özel Teklif ve İletişim Paketi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bu müşterinin eksikliklerine özel 3 kademeli fiyat teklifi, yönetici özeti, soğuk e-posta taslağı, WhatsApp mesajı ve telefon satış senaryosu otomatik üretilir.
                    </p>
                  </div>
                </div>

                {!proposalData && (
                  <button
                    onClick={handleGenerateProposal}
                    disabled={isGeneratingProposal}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    {isGeneratingProposal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Teklif Kuralları Çalıştırılıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Müşteriye Özel Otomatik Teklif Oluştur</span>
                      </>
                    )}
                  </button>
                )}

                {proposalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {proposalError}
                  </div>
                )}
              </div>

              {/* Generated Proposal Preview */}
              {proposalData && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Üretilen Teklif Paketi
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {proposalData.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => setShowProposalViewer(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Tam Raporu & İletişim Kodlarını Aç</span>
                    </button>
                  </div>

                  {/* Highlights Summary */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                      Özet Hizmet Paket Fiyatları:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {proposalData.proposedServices.map((pkg, idx) => (
                        <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <div className="font-bold text-white text-xs">{pkg.packageName}</div>
                          <div className="text-emerald-400 font-extrabold text-sm mt-1">{pkg.price}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{pkg.timeline}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outreach Quick Snippet */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-indigo-400 text-xs flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Hazır WhatsApp Satış Mesajı:</span>
                    </span>
                    <p className="text-slate-300 italic text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      "{proposalData.whatsappMessage}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proposal Full Screen Viewer Modal */}
      {showProposalViewer && proposalData && (
        <ProposalViewerModal
          prospect={prospect}
          proposal={proposalData}
          onClose={() => setShowProposalViewer(false)}
        />
      )}
    </div>
  );
};
