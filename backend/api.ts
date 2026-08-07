import type { Express, NextFunction, Request, Response } from 'express';
import type { Prospect, ProspectStatus } from '../src/types';
import { auditWebsite } from './audit';
import { discoverProspects } from './discovery';
import { generateProposal } from './proposal';
import { ProspectStore } from './store';
import { errorMessage } from './utils';

type AsyncHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

function asyncRoute(handler: AsyncHandler) {
  return (request: Request, response: Response, next: NextFunction) => {
    void Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, { count: number; resetsAt: number }>();
  return (request: Request, response: Response, next: NextFunction) => {
    const key = `${request.ip}|${request.path}`;
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetsAt <= now) {
      buckets.set(key, { count: 1, resetsAt: now + windowMs });
      next();
      return;
    }
    if (current.count >= limit) {
      response
        .status(429)
        .json({ error: 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.' });
      return;
    }
    current.count += 1;
    next();
  };
}

function statusForError(message: string): number {
  if (/bulunamadı/i.test(message)) return 404;
  if (/çok fazla/i.test(message)) return 429;
  if (
    /geçersiz|olmalıdır|karakter|desteklenir|belirtilmelidir|taranamaz/i.test(
      message,
    )
  ) {
    return 400;
  }
  return 500;
}

export function registerApiRoutes(
  app: Express,
  store = ProspectStore.fromEnvironment(),
): void {
  const discoveryLimit = createRateLimiter(12, 15 * 60_000);
  const auditLimit = createRateLimiter(30, 15 * 60_000);

  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      engine: 'geoseo-discovery-v3',
      discoveryVersion: '3.1.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get(
    '/api/prospects',
    asyncRoute(async (_request, response) => {
      response.json({ success: true, prospects: await store.list() });
    }),
  );

  app.post(
    '/api/prospects/discover',
    discoveryLimit,
    asyncRoute(async (request, response) => {
      const existingProspects = await store.list();
      const result = await discoverProspects(
        {
          location: request.body?.location,
          industry: request.body?.industry,
          limit: request.body?.limit,
        },
        existingProspects,
      );
      const stored = await store.upsertMany(result.prospects);
      response.json({
        success: true,
        prospects: stored.prospects,
        summary: {
          ...result.summary,
          added: stored.added,
          updated: stored.updated,
          skipped: result.summary.skipped + stored.skipped,
          skippedAnalyzed:
            result.summary.skippedAnalyzed + stored.skipped,
        },
      });
    }),
  );

  app.post(
    '/api/prospects',
    asyncRoute(async (request, response) => {
      const prospect = request.body as Prospect;
      const saved = await store.create(prospect);
      response.status(201).json({ success: true, prospect: saved });
    }),
  );

  app.patch(
    '/api/prospects/:id/status',
    asyncRoute(async (request, response) => {
      const status = request.body?.status as ProspectStatus;
      const prospect = await store.updateStatus(request.params.id, status);
      response.json({ success: true, prospect });
    }),
  );

  app.post(
    '/api/prospects/:id/notes',
    asyncRoute(async (request, response) => {
      const prospect = await store.addNote(
        request.params.id,
        String(request.body?.note || ''),
      );
      response.status(201).json({ success: true, prospect });
    }),
  );

  app.post(
    '/api/audit/live',
    auditLimit,
    asyncRoute(async (request, response) => {
      const url = String(request.body?.url || '').trim();
      if (!url) throw new Error('Geçerli bir URL veya domain belirtilmelidir.');
      const result = await auditWebsite(url, {
        businessName: request.body?.businessName,
        industry: request.body?.industry,
        city: request.body?.city,
        district: request.body?.district,
        phone: request.body?.phone,
      });
      response.json({
        success: true,
        url: result.url,
        audit: result.analysis.audit,
        analysis: {
          primaryOpportunity: result.analysis.primaryOpportunity,
          secondaryOpportunities: result.analysis.secondaryOpportunities,
          estimatedContractValue: result.analysis.estimatedContractValue,
          potentialScore: result.analysis.potentialScore,
          reasons: result.analysis.reasons,
        },
      });
    }),
  );

  app.post(
    '/api/proposals/generate',
    createRateLimiter(60, 15 * 60_000),
    asyncRoute(async (request, response) => {
      const prospect = request.body?.prospect as Prospect | undefined;
      if (!prospect?.businessName || !prospect.audit) {
        throw new Error('Müşteri adayı bilgileri eksik veya geçersiz.');
      }
      const agencyName =
        String(request.body?.agencyName || 'GeoSEO Scout Dijital Ajans')
          .trim()
          .slice(0, 100) || 'GeoSEO Scout Dijital Ajans';
      response.json({
        success: true,
        proposal: generateProposal(prospect, agencyName),
      });
    }),
  );

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API uç noktası bulunamadı.' });
  });

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      const message = errorMessage(error);
      const status = statusForError(message);
      if (status >= 500) {
        console.error('[api]', error);
      }
      response.status(status).json({ error: message });
    },
  );
}
