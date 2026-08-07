import React, { useState } from 'react';
import { ProposalOutput, Prospect } from '../types';
import {
  FileText,
  X,
  Printer,
  Copy,
  Check,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  Building2,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

interface ProposalViewerModalProps {
  prospect: Prospect;
  proposal: ProposalOutput;
  onClose: () => void;
}

export const ProposalViewerModal: React.FC<ProposalViewerModalProps> = ({
  prospect,
  proposal,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'proposal' | 'outreach'>('proposal');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Gemini AI Tarafından Üretildi
              </span>
              <h3 className="text-lg font-bold text-white">
                {prospect.businessName} - Kurumsal Teklif & İletişim Paketi
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF İndir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('proposal')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'proposal'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Müşteri Teklif Belgesi (Rapor)</span>
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'outreach'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>İletişim Taslakları (E-Posta, WhatsApp & Telefon)</span>
          </button>
        </div>

        {/* Document Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-xs">
          {activeTab === 'proposal' ? (
            <div className="printable-document space-y-8 bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-inner">
              {/* Proposal Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 gap-4">
                <div className="space-y-1">
                  <div className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <span className="text-emerald-400">GeoSEO Scout</span>
                    <span className="text-slate-400">| Dijital Ajans</span>
                  </div>
                  <p className="text-slate-400 text-xs">Web Tasarım, SEO & GEO (AI Search) Optimizasyon Hizmetleri</p>
                </div>

                <div className="text-left sm:text-right space-y-0.5 text-slate-400">
                  <div className="font-bold text-white text-sm">TEKLİF BELGESİ</div>
                  <div>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
                  <div>Hazırlanan Firma: <strong className="text-white">{prospect.businessName}</strong></div>
                  <div>Konum: {prospect.city} / {prospect.district}</div>
                </div>
              </div>

              {/* Title & Executive Summary */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {proposal.title}
                </h2>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed text-slate-300">
                  <h4 className="font-bold text-emerald-400 mb-1 uppercase text-[10px] tracking-wider">
                    Yönetici Özeti (Executive Summary)
                  </h4>
                  <p className="whitespace-pre-line">{proposal.executiveSummary}</p>
                </div>
              </div>

              {/* Audit Highlights Matrix */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Tespit Edilen Dijital Eksiklikler ve Çözüm Haritası</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposal.auditHighlights?.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-white text-xs">{item.issue}</h4>
                      <p className="text-slate-400 text-[11px]">
                        <strong>Ticari Etki:</strong> {item.impact}
                      </p>
                      <p className="text-emerald-300 font-medium text-[11px]">
                        <strong>Önerilen Çözüm:</strong> {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Service Packages */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">Önerilen Hizmet Paketi Seçenekleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {proposal.proposedServices?.map((pkg, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                        idx === 1
                          ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-2">
                        {idx === 1 && (
                          <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                            ÖNERİLEN PAKET
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-white">{pkg.packageName}</h4>
                        <div className="text-lg font-black text-emerald-400">{pkg.price}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Teslimat Süresi: {pkg.timeline}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                        {pkg.features?.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Results */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center space-x-2 text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>Beklenen İş Sonuçları ve Geri Dönüş (ROI)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200">
                  {proposal.expectedResults?.map((res, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{res}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cold Email Template */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Soğuk E-Posta Şablonu (Cold Email)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(`Konu: ${proposal.coldEmailTemplate.subject}\n\n${proposal.coldEmailTemplate.body}`, 'email')}
                    className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md transition-all"
                  >
                    {copiedType === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                  <div>
                    <strong className="text-slate-400">Konu:</strong> {proposal.coldEmailTemplate.subject}
                  </div>
                  <div className="h-px bg-slate-800"></div>
                  <div className="whitespace-pre-line leading-relaxed">
                    {proposal.coldEmailTemplate.body}
                  </div>
                </div>
              </div>

              {/* WhatsApp Pitch */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center space-x-2 text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp / SMS İletişim Mesajı</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://wa.me/90${prospect.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(proposal.whatsappMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-md transition-all"
                    >
                      Doğrudan WhatsApp Aç
                    </a>
                    <button
                      onClick={() => copyToClipboard(proposal.whatsappMessage, 'wa')}
                      className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md transition-all"
                    >
                      {copiedType === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-line leading-relaxed">
                  {proposal.whatsappMessage}
                </div>
              </div>

              {/* Cold Call Script */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center space-x-2 text-xs">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Telefon Görüşmesi Satış Senaryosu (Call Script)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(proposal.callScript, 'phone')}
                    className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md transition-all"
                  >
                    {copiedType === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-line leading-relaxed">
                  {proposal.callScript}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
