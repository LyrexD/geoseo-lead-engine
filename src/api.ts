import type { Prospect, ProspectStatus } from './types';

interface ApiEnvelope {
  success?: boolean;
  error?: string;
}

export interface DiscoveryQuery {
  location: string;
  industry: string;
  limit?: number;
}

export interface DiscoveryResponse {
  prospects: Prospect[];
  summary: {
    provider: 'openstreetmap';
    location: string;
    industry: string;
    examined: number;
    added: number;
    updated: number;
    skipped: number;
    skippedAnalyzed: number;
    cached: boolean;
  };
}

async function requestJson<T extends ApiEnvelope>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Sunucu HTTP ${response.status} yanıtı verdi.`);
  }
  return data;
}

export async function listProspects(): Promise<Prospect[]> {
  const data = await requestJson<ApiEnvelope & { prospects: Prospect[] }>(
    '/api/prospects',
  );
  return data.prospects;
}

export async function discoverNewProspects(
  query: DiscoveryQuery,
): Promise<DiscoveryResponse> {
  const data = await requestJson<ApiEnvelope & DiscoveryResponse>(
    '/api/prospects/discover',
    {
      method: 'POST',
      body: JSON.stringify(query),
    },
  );
  return { prospects: data.prospects, summary: data.summary };
}

export async function saveProspect(prospect: Prospect): Promise<Prospect> {
  const data = await requestJson<ApiEnvelope & { prospect: Prospect }>(
    '/api/prospects',
    {
      method: 'POST',
      body: JSON.stringify(prospect),
    },
  );
  return data.prospect;
}

export async function saveProspectStatus(
  id: string,
  status: ProspectStatus,
): Promise<Prospect> {
  const data = await requestJson<ApiEnvelope & { prospect: Prospect }>(
    `/api/prospects/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return data.prospect;
}

export async function saveProspectNote(
  id: string,
  note: string,
): Promise<Prospect> {
  const data = await requestJson<ApiEnvelope & { prospect: Prospect }>(
    `/api/prospects/${encodeURIComponent(id)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
  );
  return data.prospect;
}
