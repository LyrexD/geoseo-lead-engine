import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { registerApiRoutes } from './backend/api';

async function startServer(): Promise<void> {
  const app = express();
  // Passenger may provide either a TCP port or a Unix socket path. Keeping the
  // value intact also lets Passenger intercept the first listen() call.
  const port = process.env.PORT || 3000;

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  registerApiRoutes(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_request, response) => {
      response.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`GeoSEO Lead Engine hazır: http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Sunucu başlatılamadı:', error);
  process.exitCode = 1;
});
