import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import type { Prospect } from '../types';

interface InteractiveProspectMapProps {
  prospects: Prospect[];
  selectedProspectId?: string;
  onSelectProspect: (prospect: Prospect) => void;
}

const TURKEY_CENTER: [number, number] = [39, 35];

function markerTone(prospect: Prospect): 'critical' | 'warning' | 'standard' {
  if (prospect.audit.overallScore < 45) return 'critical';
  if (prospect.primaryOpportunity === 'non_mobile') return 'warning';
  return 'standard';
}

function createProspectIcon(prospect: Prospect, isSelected: boolean): L.DivIcon {
  const score = Math.round(prospect.audit.overallScore);
  const selectedClass = isSelected ? ' prospect-map-marker--selected' : '';

  return L.divIcon({
    className: 'prospect-map-icon',
    html: `<div class="prospect-map-marker prospect-map-marker--${markerTone(prospect)}${selectedClass}"><span>${score}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    tooltipAnchor: [0, -22],
  });
}

function FitProspects({ prospects }: { prospects: Prospect[] }) {
  const map = useMap();
  const coordinateKey = prospects
    .map((prospect) => `${prospect.id}:${prospect.lat.toFixed(6)},${prospect.lng.toFixed(6)}`)
    .join('|');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize();

      if (prospects.length === 0) {
        map.setView(TURKEY_CENTER, 6, { animate: false });
        return;
      }

      if (prospects.length === 1) {
        map.setView([prospects[0].lat, prospects[0].lng], 16, { animate: false });
        return;
      }

      map.fitBounds(
        prospects.map((prospect) => [prospect.lat, prospect.lng] as [number, number]),
        {
          animate: false,
          maxZoom: 16,
          padding: [42, 42],
        },
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [coordinateKey, map]);

  return null;
}

export function InteractiveProspectMap({
  prospects,
  selectedProspectId,
  onSelectProspect,
}: InteractiveProspectMapProps) {
  return (
    <MapContainer
      center={TURKEY_CENTER}
      zoom={6}
      minZoom={3}
      maxZoom={19}
      scrollWheelZoom
      zoomControl={false}
      className="lead-map h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <FitProspects prospects={prospects} />

      {prospects.map((prospect) => (
        <Marker
          key={prospect.id}
          position={[prospect.lat, prospect.lng]}
          icon={createProspectIcon(prospect, prospect.id === selectedProspectId)}
          title={prospect.businessName}
          eventHandlers={{
            click: () => onSelectProspect(prospect),
          }}
        >
          <Tooltip direction="top" opacity={1}>
            <strong>{prospect.businessName}</strong>
            <br />
            {prospect.district}, {prospect.city}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
