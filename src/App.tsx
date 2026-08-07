import React, { useEffect, useState } from 'react';
import { isArchivedProspectStatus, Prospect, ProspectStatus } from './types';
import {
  discoverNewProspects,
  listProspects,
  saveProspect,
  saveProspectNote,
  saveProspectStatus,
} from './api';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { ProspectRadar } from './components/ProspectRadar';
import { CRMPipeline } from './components/CRMPipeline';
import { LiveDomainScanner } from './components/LiveDomainScanner';
import { ProspectDetailModal } from './components/ProspectDetailModal';
import { AddProspectModal } from './components/AddProspectModal';
import { Radar, Heart } from 'lucide-react';

export default function App() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'radar' | 'crm' | 'scanner'>('dashboard');
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState<string>('all');
  const [backendError, setBackendError] = useState('');

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    listProspects()
      .then((items) => {
        if (active) setProspects(items);
      })
      .catch((error: Error) => {
        if (active) setBackendError(`CRM verileri yüklenemedi: ${error.message}`);
      });
    return () => {
      active = false;
    };
  }, []);

  const mergeProspects = (items: Prospect[]) => {
    setProspects((previous) => {
      const byId = new Map<string, Prospect>(
        previous.map((prospect) => [prospect.id, prospect]),
      );
      items.forEach((prospect) => byId.set(prospect.id, prospect));
      return Array.from(byId.values()).sort(
        (a, b) =>
          (b.discovery?.potentialScore ?? 0) -
          (a.discovery?.potentialScore ?? 0),
      );
    });
  };

  // Update prospect CRM status
  const handleUpdateStatus = (id: string, newStatus: ProspectStatus) => {
    const previousStatus = prospects.find((prospect) => prospect.id === id)?.status;
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p))
    );
    if (selectedProspect && selectedProspect.id === id) {
      setSelectedProspect((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    saveProspectStatus(id, newStatus)
      .then((saved) => {
        mergeProspects([saved]);
        if (selectedProspect?.id === id) setSelectedProspect(saved);
        setBackendError('');
      })
      .catch((error: Error) => {
        if (previousStatus) {
          setProspects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: previousStatus } : p)),
          );
        }
        setBackendError(`CRM aşaması kaydedilemedi: ${error.message}`);
      });
  };

  // Add note to a prospect
  const handleAddNote = (id: string, noteText: string) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, notes: [...p.notes, noteText], updatedAt: new Date().toISOString() } : p
      )
    );
    if (selectedProspect && selectedProspect.id === id) {
      setSelectedProspect((prev) => (prev ? { ...prev, notes: [...prev.notes, noteText] } : null));
    }
    saveProspectNote(id, noteText)
      .then((saved) => {
        mergeProspects([saved]);
        if (selectedProspect?.id === id) setSelectedProspect(saved);
        setBackendError('');
      })
      .catch((error: Error) => {
        setBackendError(`Not kaydedilemedi: ${error.message}`);
      });
  };

  // Add new manual prospect
  const handleAddProspect = (newProspect: Prospect) => {
    setProspects((prev) => [newProspect, ...prev]);
    saveProspect(newProspect)
      .then((saved) => {
        mergeProspects([saved]);
        if (selectedProspect?.id === newProspect.id) setSelectedProspect(saved);
        setBackendError('');
      })
      .catch((error: Error) => {
        setBackendError(`Müşteri adayı kaydedilemedi: ${error.message}`);
      });
  };

  // Navigation filter shortcut handler
  const handleFilterByOpportunity = (oppType: string) => {
    setSelectedOpportunityFilter(oppType);
    setActiveTab('radar');
  };

  // Calculate statistics for header
  const activeProspects = prospects.filter(
    (prospect) => !isArchivedProspectStatus(prospect.status),
  );
  const totalProspects = activeProspects.length;
  const highPriorityCount = activeProspects.filter(
    (p) => p.primaryOpportunity === 'no_maps' || p.audit.overallScore < 45
  ).length;
  const proposalsSent = activeProspects.filter((p) => p.status === 'proposal_sent' || p.status === 'negotiating').length;
  const totalPotentialRevenue = activeProspects.reduce((acc, p) => acc + p.estimatedContractValue, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenLiveScanner={() => setActiveTab('scanner')}
        stats={{
          totalProspects,
          highPriorityCount,
          proposalsSent,
          totalPotentialRevenue,
        }}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {backendError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {backendError}
          </div>
        )}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            prospects={activeProspects}
            onSelectProspect={(p) => setSelectedProspect(p)}
            onFilterByOpportunity={handleFilterByOpportunity}
            onNavigateToRadar={() => setActiveTab('radar')}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'radar' && (
          <ProspectRadar
            prospects={activeProspects}
            onSelectProspect={(p) => setSelectedProspect(p)}
            selectedOpportunityFilter={selectedOpportunityFilter}
            setSelectedOpportunityFilter={setSelectedOpportunityFilter}
            onDiscover={async (query) => {
              const result = await discoverNewProspects(query);
              mergeProspects(result.prospects);
              setBackendError('');
              return result;
            }}
          />
        )}

        {activeTab === 'crm' && (
          <CRMPipeline
            prospects={prospects}
            onUpdateProspectStatus={handleUpdateStatus}
            onSelectProspect={(p) => setSelectedProspect(p)}
            onAddNote={handleAddNote}
          />
        )}

        {activeTab === 'scanner' && (
          <LiveDomainScanner
            onSaveToCrm={(newP) => {
              handleAddProspect(newP);
              setSelectedProspect(newP);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              <Radar className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-300">GeoSEO Scout CRM & Audit Platform</span>
          </div>
          <p className="text-slate-400">
            Web Tasarım, HTML5, Local SEO ve GEO (Generative Engine Optimization) Ajans Satış Otomasyonu
          </p>
        </div>
      </footer>

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddNote={handleAddNote}
        />
      )}

      {/* Add New Prospect Modal */}
      {isAddModalOpen && (
        <AddProspectModal
          onClose={() => setIsAddModalOpen(false)}
          onAddProspect={handleAddProspect}
        />
      )}
    </div>
  );
}
