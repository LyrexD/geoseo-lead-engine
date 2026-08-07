import { createHash } from 'node:crypto';

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function rounded(value: number): number {
  return Math.round(value);
}

export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function stableId(...parts: Array<string | number | undefined>): string {
  const raw = parts.filter((part) => part !== undefined).join('|');
  return `prospect-${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;
}

export function escapeOverpass(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, entity: string) =>
      entities[entity.toLowerCase()] ?? match,
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripTags(value: string): string {
  return decodeHtml(value.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
}

export function normalizeWebsite(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Yalnızca HTTP veya HTTPS adresleri desteklenir.');
  }
  url.username = '';
  url.password = '';
  url.hash = '';
  return url.toString();
}

export function getHostname(value: string): string {
  try {
    return new URL(normalizeWebsite(value)).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function formatAddress(tags: Record<string, string>, fallback: string): string {
  const street = [tags['addr:street'], tags['addr:housenumber']]
    .filter(Boolean)
    .join(' ');
  const locality =
    tags['addr:district'] ||
    tags['addr:suburb'] ||
    tags['addr:neighbourhood'] ||
    tags['addr:city'];
  const parts = [street, locality, tags['addr:city']]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
  return parts.join(', ') || fallback;
}

export function formatTry(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
