import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Prospect, ProspectStatus } from '../src/types';
import { getHostname, normalizeText } from './utils';

interface StoredData {
  version: 1;
  prospects: Prospect[];
}

interface UpsertResult {
  prospects: Prospect[];
  added: number;
  updated: number;
  skipped: number;
}

const VALID_STATUSES = new Set<ProspectStatus>([
  'new',
  'audited',
  'proposal_sent',
  'negotiating',
  'won',
  'lost',
  'closed',
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isProspect(value: unknown): value is Prospect {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Prospect>;
  return Boolean(
    typeof item.id === 'string' &&
      typeof item.businessName === 'string' &&
      typeof item.city === 'string' &&
      typeof item.status === 'string' &&
      item.audit &&
      Array.isArray(item.notes),
  );
}

function duplicateIndex(records: Prospect[], incoming: Prospect): number {
  const exact = records.findIndex((item) => item.id === incoming.id);
  if (exact >= 0) return exact;

  const sourceId = incoming.discovery?.sourceId;
  const provider = incoming.discovery?.provider;
  if (sourceId && provider) {
    const sourceMatch = records.findIndex(
      (item) =>
        item.discovery?.provider === provider &&
        item.discovery?.sourceId === sourceId,
    );
    if (sourceMatch >= 0) return sourceMatch;
  }

  const hostname = getHostname(incoming.websiteUrl);
  if (hostname) {
    const websiteMatch = records.findIndex(
      (item) => getHostname(item.websiteUrl) === hostname,
    );
    if (websiteMatch >= 0) return websiteMatch;
  }

  const identity = `${normalizeText(incoming.businessName)}|${normalizeText(incoming.city)}|${normalizeText(incoming.district)}`;
  return records.findIndex(
    (item) =>
      `${normalizeText(item.businessName)}|${normalizeText(item.city)}|${normalizeText(item.district)}` ===
      identity,
  );
}

function mergeProspect(existing: Prospect, incoming: Prospect): Prospect {
  return {
    ...existing,
    ...incoming,
    id: existing.id,
    status: existing.status,
    notes: existing.notes,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    discovery: incoming.discovery
      ? {
          ...existing.discovery,
          ...incoming.discovery,
        }
      : existing.discovery,
  };
}

export class ProspectStore {
  private records: Prospect[] = [];
  private loaded = false;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  static fromEnvironment(): ProspectStore {
    const dataDirectory = path.resolve(process.env.DATA_DIR || '.data');
    return new ProspectStore(path.join(dataDirectory, 'prospects.json'));
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoredData>;
      this.records = Array.isArray(parsed.prospects)
        ? parsed.prospects.filter(isProspect)
        : [];
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';
      if (code !== 'ENOENT') throw error;
      this.records = [];
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const payload: StoredData = { version: 1, prospects: this.records };
    await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.filePath);
  }

  private async mutate<T>(operation: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.mutationQueue;
    this.mutationQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      await this.ensureLoaded();
      return await operation();
    } finally {
      release();
    }
  }

  async list(): Promise<Prospect[]> {
    await this.ensureLoaded();
    return clone(
      [...this.records].sort((a, b) => {
        const scoreDifference =
          (b.discovery?.potentialScore ?? 0) -
          (a.discovery?.potentialScore ?? 0);
        if (scoreDifference) return scoreDifference;
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }),
    );
  }

  async upsertMany(incoming: Prospect[]): Promise<UpsertResult> {
    return this.mutate(async () => {
      let added = 0;
      let updated = 0;
      let skipped = 0;
      const touched: Prospect[] = [];

      for (const prospect of incoming) {
        if (!isProspect(prospect)) continue;
        const index = duplicateIndex(this.records, prospect);
        if (index >= 0) {
          const existing = this.records[index];
          if (existing.status !== 'new' && prospect.status === 'new') {
            touched.push(existing);
            skipped += 1;
            continue;
          }
          const merged = mergeProspect(this.records[index], prospect);
          this.records[index] = merged;
          touched.push(merged);
          updated += 1;
        } else {
          this.records.push(clone(prospect));
          touched.push(prospect);
          added += 1;
        }
      }

      if (added || updated) await this.persist();
      return { prospects: clone(touched), added, updated, skipped };
    });
  }

  async create(prospect: Prospect): Promise<Prospect> {
    const result = await this.upsertMany([prospect]);
    if (!result.prospects[0]) {
      throw new Error('Müşteri adayı kaydı geçersiz.');
    }
    return result.prospects[0];
  }

  async updateStatus(id: string, status: ProspectStatus): Promise<Prospect> {
    if (!VALID_STATUSES.has(status)) {
      throw new Error('Geçersiz CRM aşaması.');
    }
    return this.mutate(async () => {
      const index = this.records.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Müşteri adayı bulunamadı.');
      this.records[index] = {
        ...this.records[index],
        status,
        updatedAt: new Date().toISOString(),
      };
      await this.persist();
      return clone(this.records[index]);
    });
  }

  async addNote(id: string, note: string): Promise<Prospect> {
    const text = note.trim();
    if (!text || text.length > 1_000) {
      throw new Error('Not 1-1000 karakter arasında olmalıdır.');
    }
    return this.mutate(async () => {
      const index = this.records.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Müşteri adayı bulunamadı.');
      this.records[index] = {
        ...this.records[index],
        notes: [...this.records[index].notes, text],
        updatedAt: new Date().toISOString(),
      };
      await this.persist();
      return clone(this.records[index]);
    });
  }
}
