import { isIP } from 'node:net';
import { resolve4, resolve6 } from 'node:dns/promises';
import { errorMessage, normalizeWebsite } from './utils';

export interface LimitedResponse {
  url: string;
  status: number;
  ok: boolean;
  headers: Headers;
  body: string;
  elapsedMs: number;
}

interface FetchLimitedOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: BodyInit;
  validatePublicAddress?: boolean;
}

const DEFAULT_USER_AGENT =
  'GeoSEOLeadEngine/2.0 (+https://localhost; business-site-audit)';

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0];
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIpv4(mapped[1]) : false;
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

async function assertPublicHostname(url: URL): Promise<void> {
  const allowlist = new Set(
    (process.env.AUDIT_HOST_ALLOWLIST || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
  if (allowlist.has(url.hostname.toLowerCase())) return;

  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw new Error('Yerel ağ adresleri güvenlik nedeniyle taranamaz.');
  }

  if (isIP(url.hostname)) {
    if (isPrivateAddress(url.hostname)) {
      throw new Error('Özel veya yerel IP adresleri güvenlik nedeniyle taranamaz.');
    }
    return;
  }

  const [ipv4, ipv6] = await Promise.all([
    resolve4(url.hostname).catch(() => []),
    resolve6(url.hostname).catch(() => []),
  ]);
  const addresses = [...ipv4, ...ipv6];
  if (!addresses.length) {
    throw new Error('Alan adının DNS kaydı çözümlenemedi.');
  }
  if (addresses.some(isPrivateAddress)) {
    throw new Error('Alan adı özel veya yerel bir IP adresine yönleniyor.');
  }
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let body = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Yanıt ${Math.round(maxBytes / 1024)} KB sınırını aşıyor.`);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return body;
}

export async function fetchLimited(
  input: string,
  options: FetchLimitedOptions = {},
): Promise<LimitedResponse> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 2_000_000;
  let target = new URL(normalizeWebsite(input));
  const startedAt = Date.now();

  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    if (options.validatePublicAddress !== false) {
      await assertPublicHostname(target);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(target, {
        method: options.method ?? 'GET',
        body: options.body,
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Accept: 'text/html,application/json;q=0.9,*/*;q=0.5',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.7',
          ...options.headers,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`İstek ${Math.round(timeoutMs / 1000)} saniyede zaman aşımına uğradı.`);
      }
      throw new Error(`Uzak sunucuya bağlanılamadı: ${errorMessage(error)}`);
    } finally {
      clearTimeout(timeout);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Geçersiz yönlendirme yanıtı alındı.');
      target = new URL(location, target);
      if (!['http:', 'https:'].includes(target.protocol)) {
        throw new Error('Güvenli olmayan bir yönlendirme engellendi.');
      }
      continue;
    }

    const body = await readBodyWithLimit(response, maxBytes);
    return {
      url: target.toString(),
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body,
      elapsedMs: Date.now() - startedAt,
    };
  }

  throw new Error('Çok fazla HTTP yönlendirmesi alındı.');
}
