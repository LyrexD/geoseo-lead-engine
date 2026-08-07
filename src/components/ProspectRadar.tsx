import React, { useState } from 'react';
import {
  isAnalyzedProspectStatus,
  type OpportunityType,
  type Prospect,
} from '../types';
import type { DiscoveryQuery, DiscoveryResponse } from '../api';
import { InteractiveProspectMap } from './InteractiveProspectMap';
import {
  buildGoogleMapsSearchUrl,
  GoogleMapsPreview,
} from './GoogleMapsPreview';
import {
  Search,
  MapPin,
  Filter,
  Building2,
  Smartphone,
  Bot,
  Star,
  Phone,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Check,
  ShieldAlert,
  SlidersHorizontal,
  Loader2,
  Radar
} from 'lucide-react';

const HIGH_VALUE_INDUSTRY_GROUPS = [
  {
    label: 'Sağlık ve estetik',
    options: [
      'Diş Hekimi / Diş Kliniği',
      'Saç Ekimi / Medikal Estetik',
      'Estetik / Plastik Cerrahi Kliniği',
      'Göz Kliniği / Göz Hastanesi',
      'Tüp Bebek / Kadın Doğum Kliniği',
      'Özel Hastane / Tıp Merkezi',
      'Psikolog / Psikiyatri Kliniği',
      'Veteriner Kliniği',
    ],
  },
  {
    label: 'Profesyonel hizmetler ve gayrimenkul',
    options: [
      'Avukat / Hukuk Bürosu',
      'Gayrimenkul / Emlak Ofisi',
      'İnşaat / Müteahhitlik',
      'Mimarlık / İç Mimarlık',
      'Sigorta Acentesi',
    ],
  },
  {
    label: 'Konaklama ve eğitim',
    options: [
      'Otel / Butik Otel',
      'Özel Okul / Kolej',
      'Dil Okulu / Özel Kurs',
      'Düğün Salonu / Etkinlik Mekanı',
      'Tur / Seyahat Acentesi',
    ],
  },
  {
    label: 'Otomotiv ve yüksek değerli perakende',
    options: [
      'Oto Galeri / Yetkili Satıcı',
      'Oto Servis / Ekspertiz',
      'Araç Kiralama',
      'Mobilya / Özel Mutfak',
      'Kuyumcu / Mücevher',
    ],
  },
  {
    label: 'Yoğun yerel talep',
    options: [
      'Güzellik Merkezi / Lazer Epilasyon',
      'Spor Salonu / Pilates',
    ],
  },
] as const;

const HIGH_VALUE_INDUSTRIES = HIGH_VALUE_INDUSTRY_GROUPS.flatMap(
  (group) => group.options,
);

function normalizeIndustry(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

interface ProspectRadarProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  selectedOpportunityFilter: string;
  setSelectedOpportunityFilter: (type: string) => void;
  onDiscover: (query: DiscoveryQuery) => Promise<DiscoveryResponse>;
}

export const ProspectRadar: React.FC<ProspectRadarProps> = ({
  prospects,
  onSelectProspect,
  selectedOpportunityFilter,
  setSelectedOpportunityFilter,
  onDiscover,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [activeView, setActiveView] = useState<'split' | 'map' | 'list'>('split');
  const [activeProspectList, setActiveProspectList] = useState<
    'untouched' | 'analyzed'
  >('untouched');
  const [mapProvider, setMapProvider] = useState<'google' | 'openstreetmap'>('google');
  const [selectedPinProspect, setSelectedPinProspect] = useState<Prospect | null>(null);
  const [targetLocation, setTargetLocation] = useState('Kadıköy, İstanbul');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [isIndustryMenuOpen, setIsIndustryMenuOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState('');
  const [discoveryError, setDiscoveryError] = useState('');

  const normalizedTargetIndustry = normalizeIndustry(targetIndustry);
  const isPresetIndustry = HIGH_VALUE_INDUSTRIES.some(
    (industry) => normalizeIndustry(industry) === normalizedTargetIndustry,
  );
  const visibleIndustryGroups = HIGH_VALUE_INDUSTRY_GROUPS.map((group) => ({
    ...group,
    options: group.options.filter(
      (industry) =>
        !normalizedTargetIndustry ||
        isPresetIndustry ||
        normalizeIndustry(industry).includes(normalizedTargetIndustry),
    ),
  })).filter((group) => group.options.length > 0);

  // Extract unique cities & industries
  const cities = Array.from(new Set(prospects.map((p) => p.city)));
  const industries = Array.from(new Set(prospects.map((p) => p.industry)));

  // Filter prospects
  const matchingProspects = prospects.filter((p) => {
    const matchesSearch =
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.websiteUrl && p.websiteUrl.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCity = selectedCity === 'all' || p.city === selectedCity;
    const matchesIndustry = selectedIndustry === 'all' || p.industry === selectedIndustry;

    let matchesOpp = true;
    if (selectedOpportunityFilter === 'no_maps') {
      matchesOpp =
        p.primaryOpportunity === 'no_maps' ||
        (p.audit.maps.isVerified !== false && !p.audit.maps.existsOnMaps);
    } else if (selectedOpportunityFilter === 'non_mobile') {
      matchesOpp = p.primaryOpportunity === 'non_mobile' || !p.audit.technical.hasViewportMeta;
    } else if (selectedOpportunityFilter === 'no_geo_schema') {
      matchesOpp = p.primaryOpportunity === 'no_geo_schema' || !p.audit.geo.hasJsonLd;
    } else if (selectedOpportunityFilter === 'missing_website') {
      matchesOpp = !p.websiteUrl || p.primaryOpportunity === 'missing_website';
    } else if (selectedOpportunityFilter === 'low_rating') {
      matchesOpp = p.primaryOpportunity === 'low_rating' || (p.audit.maps.rating > 0 && p.audit.maps.rating < 3.8);
    }

    return matchesSearch && matchesCity && matchesIndustry && matchesOpp;
  });
  const untouchedProspectCount = matchingProspects.filter(
    (prospect) => !isAnalyzedProspectStatus(prospect.status),
  ).length;
  const analyzedProspectCount = matchingProspects.filter((prospect) =>
    isAnalyzedProspectStatus(prospect.status),
  ).length;
  const filteredProspects = matchingProspects.filter((prospect) =>
    activeProspectList === 'analyzed'
      ? isAnalyzedProspectStatus(prospect.status)
      : !isAnalyzedProspectStatus(prospect.status),
  );

  const handleDiscover = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetLocation.trim() || !targetIndustry.trim()) return;
    setIsDiscovering(true);
    setDiscoveryMessage('');
    setDiscoveryError('');
    try {
      const result = await onDiscover({
        location: targetLocation.trim(),
        industry: targetIndustry.trim(),
        limit: 12,
      });
      const { added, updated, examined, cached, skippedAnalyzed } = result.summary;
      setDiscoveryMessage(
        `${examined} kayıt incelendi; ${added} yeni aday eklendi, ${updated} kayıt güncellendi${
          skippedAnalyzed > 0
            ? `, daha önce analiz edilen ${skippedAnalyzed} işletme atlandı`
            : ''
        }${cached ? ' (önbellekten)' : ''}.`,
      );
    } catch (error) {
      setDiscoveryError(
        error instanceof Error ? error.message : 'Bölgesel tarama tamamlanamadı.',
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const coordinateProspects = filteredProspects.filter(
    (prospect) =>
      Number.isFinite(prospect.lat) &&
      Number.isFinite(prospect.lng) &&
      prospect.lat >= -90 &&
      prospect.lat <= 90 &&
      prospect.lng >= -180 &&
      prospect.lng <= 180 &&
      (prospect.lat !== 0 || prospect.lng !== 0),
  );
  const visibleSelectedPin =
    selectedPinProspect &&
    coordinateProspects.some((prospect) => prospect.id === selectedPinProspect.id)
      ? selectedPinProspect
      : null;
  const googlePreviewProspect = visibleSelectedPin ?? coordinateProspects[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Top Header & Search Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Harita ve Bölgesel Müşteri Adayı Radarı</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Filtreleri kullanarak hedef işletmeleri arayın, haritadaki eksiklerini görün ve teklif üretin.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'split' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'
              }`}
            >
              İkili Görünüm
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'map' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'
              }`}
            >
              Sadece Harita
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'list' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400'
              }`}
            >
              Sadece Liste
            </button>
          </div>
        </div>

        {/* Real regional discovery controls */}
        <form
          onSubmit={handleDiscover}
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 border-t border-slate-800 pt-4"
        >
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
            <input
              type="text"
              value={targetLocation}
              onChange={(event) => setTargetLocation(event.target.value)}
              placeholder="İlçe, şehir (örn. Kadıköy, İstanbul)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsIndustryMenuOpen(false);
              }
            }}
          >
            <Building2 className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
            <input
              type="text"
              value={targetIndustry}
              onChange={(event) => {
                setTargetIndustry(event.target.value);
                setIsIndustryMenuOpen(true);
              }}
              onFocus={() => setIsIndustryMenuOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsIndustryMenuOpen(false);
                if (event.key === 'ArrowDown') setIsIndustryMenuOpen(true);
              }}
              placeholder="Hedef sektör (örn. diş hekimi)"
              role="combobox"
              aria-label="Hedef sektör"
              aria-autocomplete="list"
              aria-expanded={isIndustryMenuOpen}
              aria-controls="high-value-industry-options"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setIsIndustryMenuOpen((isOpen) => !isOpen)}
              aria-label="Hazır sektörleri göster"
              aria-expanded={isIndustryMenuOpen}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-emerald-400"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isIndustryMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isIndustryMenuOpen && (
              <div
                id="high-value-industry-options"
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl shadow-slate-950/70"
              >
                <div className="border-b border-slate-800 px-2 pb-2 pt-1">
                  <p className="text-[11px] font-bold text-white">Hazır yüksek potansiyelli sektörler</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    25 hazır seçenekten birini seçin veya kendi sektörünüzü yazın.
                  </p>
                </div>

                {visibleIndustryGroups.length > 0 ? (
                  visibleIndustryGroups.map((group) => (
                    <div key={group.label} className="pt-2">
                      <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {group.label}
                      </p>
                      {group.options.map((industry) => {
                        const isSelected = normalizeIndustry(industry) === normalizedTargetIndustry;
                        return (
                          <button
                            key={industry}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setTargetIndustry(industry);
                              setIsIndustryMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/15 font-semibold text-emerald-300'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{industry}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-[11px] text-slate-400">
                    Hazır eşleşme yok. Yazdığınız özel sektörle arama yapabilirsiniz.
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isDiscovering || !targetLocation.trim() || !targetIndustry.trim()}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-50 text-xs transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            {isDiscovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Radar className="w-4 h-4" />
            )}
            <span>{isDiscovering ? 'Bölge Taranıyor...' : 'Yeni Adayları Bul'}</span>
          </button>
        </form>

        {(discoveryMessage || discoveryError) && (
          <div
            className={`text-xs rounded-lg px-3 py-2 border ${
              discoveryError
                ? 'text-red-300 bg-red-500/10 border-red-500/20'
                : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            {discoveryError || discoveryMessage}
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Firma adı, domain veya ilçe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <select
              value={selectedOpportunityFilter}
              onChange={(e) => setSelectedOpportunityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">Fırsat Tipi: Tüm Eksiklikler</option>
              <option value="no_maps">📍 Google Maps Kaydı Yok</option>
              <option value="non_mobile">📱 Mobil Uyumsuz (Bozuk)</option>
              <option value="no_geo_schema">🤖 GEO / AI Arama Eksik</option>
              <option value="missing_website">🌐 Web Sitesi Olmayanlar</option>
              <option value="low_rating">⭐ Düşük Puanlı Maps Profil</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">Şehir: Tüm Şehirler</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="all">Sektör: Tüm Sektörler</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Filtrelerde toplam <strong>{matchingProspects.length}</strong> potansiyel firma bulundu.
          </span>
          {(searchTerm || selectedCity !== 'all' || selectedIndustry !== 'all' || selectedOpportunityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('all');
                setSelectedIndustry('all');
                setSelectedOpportunityFilter('all');
              }}
              className="text-emerald-400 hover:underline font-medium"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-6 ${
        activeView === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
      }`}>
        {/* Interactive Map Section */}
        {(activeView === 'split' || activeView === 'map') && (
          <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col ${
            activeView === 'split' ? 'lg:col-span-5 h-[650px]' : 'h-[650px]'
          }`}>
            <div className="mb-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Harita İğneleri & Fırsat Lokasyonları</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {mapProvider === 'google'
                    ? 'İşletmeyi seçerek Google Maps konumunu önizleyin'
                    : 'Haritayı kaydırın, yakınlaştırın veya iğneye tıklayın'}
                </span>
              </div>

              <div
                className="flex w-fit items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-[11px] font-semibold"
                role="group"
                aria-label="Harita sağlayıcısı"
              >
                <button
                  type="button"
                  onClick={() => setMapProvider('google')}
                  aria-pressed={mapProvider === 'google'}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    mapProvider === 'google'
                      ? 'border border-slate-700 bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google Maps
                </button>
                <button
                  type="button"
                  onClick={() => setMapProvider('openstreetmap')}
                  aria-pressed={mapProvider === 'openstreetmap'}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    mapProvider === 'openstreetmap'
                      ? 'border border-slate-700 bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  OpenStreetMap
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col">
              <div className="relative isolate flex-1 min-h-[450px]">
                {mapProvider === 'google' ? (
                  googlePreviewProspect && (
                    <GoogleMapsPreview prospect={googlePreviewProspect} />
                  )
                ) : (
                  <InteractiveProspectMap
                    prospects={coordinateProspects}
                    selectedProspectId={visibleSelectedPin?.id}
                    onSelectProspect={setSelectedPinProspect}
                  />
                )}

                {mapProvider === 'google' && googlePreviewProspect && (
                  <div className="absolute left-3 right-12 top-3 z-[1100] sm:right-auto sm:w-72">
                    <label
                      htmlFor="google-maps-prospect-preview"
                      className="mb-1 block w-fit rounded-md bg-slate-950/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 shadow backdrop-blur"
                    >
                      Önizlenen işletme
                    </label>
                    <select
                      id="google-maps-prospect-preview"
                      value={googlePreviewProspect.id}
                      onChange={(event) => {
                        const selectedProspect = coordinateProspects.find(
                          (prospect) => prospect.id === event.target.value,
                        );
                        if (selectedProspect) setSelectedPinProspect(selectedProspect);
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur focus:border-emerald-500 focus:outline-none"
                    >
                      {coordinateProspects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.businessName} — {prospect.district}, {prospect.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {coordinateProspects.length === 0 && (
                  <div className="absolute inset-0 z-[1100] flex items-center justify-center pointer-events-none">
                    <div className="max-w-xs rounded-xl border border-slate-700 bg-slate-950/90 px-5 py-4 text-center shadow-2xl backdrop-blur">
                      <MapPin className="mx-auto h-6 w-6 text-slate-500" />
                      <p className="mt-2 text-xs font-semibold text-white">
                        Bu filtrede koordinatlı işletme yok
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Yeni aday taraması yaptığınızda gerçek konumlar burada gösterilir.
                      </p>
                    </div>
                  </div>
                )}

                {/* Map Selected Pin Modal / Popup Card */}
                {visibleSelectedPin && (
                  <div className="absolute bottom-5 left-4 right-4 z-[1100] bg-slate-900/95 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {visibleSelectedPin.industry}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {visibleSelectedPin.businessName}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {visibleSelectedPin.address}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPinProspect(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-400">Genel Skor:</span>{' '}
                        <strong className="text-red-400">{visibleSelectedPin.audit.overallScore}/100</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Aylık Kayıp:</span>{' '}
                        <strong className="text-emerald-400">₺{visibleSelectedPin.audit.estimatedMonthlyLeadLoss?.toLocaleString('tr-TR')}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <button
                        onClick={() => onSelectProspect(visibleSelectedPin)}
                        className="flex-1 bg-emerald-500 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs hover:bg-emerald-400 transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Detaylı İncele ve Teklif Al</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={mapProvider === 'google'
                          ? buildGoogleMapsSearchUrl(visibleSelectedPin)
                          : visibleSelectedPin.mapsUrl ||
                            `https://www.openstreetmap.org/?mlat=${visibleSelectedPin.lat}&mlon=${visibleSelectedPin.lng}#map=18/${visibleSelectedPin.lat}/${visibleSelectedPin.lng}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-500/50 hover:text-emerald-400 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>
                          {mapProvider === 'google' ? "Google Maps'te Aç" : 'Haritada Aç'}
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Footer Legend */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 px-3 py-2 border-t border-slate-800 bg-slate-950">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>Kritik Hata (&lt;45)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Mobil / GEO Eksik</span>
                  </div>
                </div>
                <span>
                  {mapProvider === 'google'
                    ? `${googlePreviewProspect ? 1 : 0}/${coordinateProspects.length} işletme Google Maps'te önizleniyor`
                    : `${coordinateProspects.length} gerçek konum gösteriliyor`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Prospect List Table Section */}
        {(activeView === 'split' || activeView === 'list') && (
          <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 ${
            activeView === 'split' ? 'lg:col-span-7' : 'col-span-1'
          }`}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Potansiyel Müşteri Listeleri</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {filteredProspects.length} Kayıt
                </span>
              </div>

              <div
                role="tablist"
                aria-label="Potansiyel müşteri analiz durumu"
                className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-[11px] font-semibold"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeProspectList === 'untouched'}
                  onClick={() => setActiveProspectList('untouched')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all ${
                    activeProspectList === 'untouched'
                      ? 'border border-slate-700 bg-slate-800 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>İşlem Yapılmayanlar</span>
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                    {untouchedProspectCount}
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeProspectList === 'analyzed'}
                  onClick={() => setActiveProspectList('analyzed')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all ${
                    activeProspectList === 'analyzed'
                      ? 'border border-slate-700 bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Analiz Edilenler</span>
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-400">
                    {analyzedProspectCount}
                  </span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Firma & Sektör</th>
                    <th className="py-3 px-3">Konum</th>
                    <th className="py-3 px-3">Analiz Skoru</th>
                    <th className="py-3 px-3">Ana Fırsat / Eksik</th>
                    <th className="py-3 px-3">Tahmini Ciro Kaybı</th>
                    <th className="py-3 px-3 text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProspects.map((prospect) => {
                    const isNoMaps =
                      prospect.primaryOpportunity === 'no_maps' ||
                      (prospect.audit.maps.isVerified !== false && !prospect.audit.maps.existsOnMaps);
                    const isNonMobile = prospect.primaryOpportunity === 'non_mobile' || !prospect.audit.technical.hasViewportMeta;
                    const isNoGeo = prospect.primaryOpportunity === 'no_geo_schema' || !prospect.audit.geo.hasJsonLd;

                    return (
                      <tr
                        key={prospect.id}
                        className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        onClick={() => onSelectProspect(prospect)}
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex flex-col">
                            <span className="group-hover:text-emerald-400 transition-colors">
                              {prospect.businessName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {prospect.industry}
                            </span>
                            <span className={`mt-1 w-fit rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              isAnalyzedProspectStatus(prospect.status)
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-300'
                            }`}>
                              {isAnalyzedProspectStatus(prospect.status)
                                ? 'Analiz edildi'
                                : 'İşlem yapılmadı'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                          {prospect.city}, {prospect.district}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-md font-bold text-[11px] ${
                            prospect.audit.overallScore < 40
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : prospect.audit.overallScore < 60
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {prospect.audit.overallScore} / 100
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {isNoMaps ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              📍 Harita Kaydı Yok
                            </span>
                          ) : isNonMobile ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              📱 Mobil Bozuk
                            </span>
                          ) : isNoGeo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              🤖 GEO / AI Eksik
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              🌐 Web İhtiyacı
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap font-extrabold text-red-400">
                          ₺{prospect.audit.estimatedMonthlyLeadLoss?.toLocaleString('tr-TR')}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProspect(prospect);
                            }}
                            className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            {isAnalyzedProspectStatus(prospect.status)
                              ? 'Analizi Görüntüle'
                              : 'Analiz Et'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProspects.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {activeProspectList === 'analyzed'
                    ? 'Arama kriterlerine uygun analiz edilmiş işletme bulunamadı.'
                    : 'Arama kriterlerine uygun işlem yapılmamış işletme bulunamadı.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
