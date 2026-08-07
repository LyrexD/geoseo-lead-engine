import type { Prospect } from '../types';

interface GoogleMapsPreviewProps {
  prospect: Prospect;
}

export function buildGoogleMapsEmbedUrl(prospect: Prospect): string {
  const coordinates = `${prospect.lat},${prospect.lng}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(coordinates)}&z=17&output=embed`;
}

export function buildGoogleMapsSearchUrl(prospect: Prospect): string {
  const coordinates = `${prospect.lat},${prospect.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
}

export function GoogleMapsPreview({ prospect }: GoogleMapsPreviewProps) {
  return (
    <iframe
      key={prospect.id}
      src={buildGoogleMapsEmbedUrl(prospect)}
      title={`${prospect.businessName} Google Maps önizlemesi`}
      className="h-full min-h-[450px] w-full border-0"
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
