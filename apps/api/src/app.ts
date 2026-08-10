import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/requireAuth.js';
import { adminLimiter, publicLimiter } from './middleware/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { adminProjectsRouter, publicProjectsRouter } from './routes/projects.js';
import { adminSettingsRouter, publicSettingsRouter } from './routes/settings.js';
import { adminGithubRouter, publicGithubRouter } from './routes/github.js';
import { uploadsRouter } from './routes/uploads.js';

export function createApp() {
  const app = express();

  // Dietro nginx e Cloudflare: senza questo il rate limiting vedrebbe un solo IP.
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  // Pubblico
  app.use('/api/projects', publicLimiter, publicProjectsRouter);
  app.use('/api/settings', publicLimiter, publicSettingsRouter);
  app.use('/api/github', publicLimiter, publicGithubRouter);

  // Admin: /auth ha i suoi limiter più stretti, tutto il resto passa da requireAuth.
  app.use('/api/admin/auth', authRouter);
  app.use('/api/admin/projects', adminLimiter, requireAuth, adminProjectsRouter);
  app.use('/api/admin/settings', adminLimiter, requireAuth, adminSettingsRouter);
  app.use('/api/admin/github', adminLimiter, requireAuth, adminGithubRouter);
  app.use('/api/admin/uploads', adminLimiter, requireAuth, uploadsRouter);

  // In dev serve i file caricati; in produzione ci pensa nginx.
  if (!env.isProd) {
    app.use('/uploads', express.static(env.UPLOAD_DIR));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
