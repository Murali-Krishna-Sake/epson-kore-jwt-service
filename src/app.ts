import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { config } from './config/config';
import { log } from './utils/logger';
import { redis } from './store/redis';
import { sessionRouter } from './routes/session';
import { jwtRouter } from './routes/jwt';
import { legacyRouter } from './routes/legacy';
import { requestId } from './middleware/requestId';
import { accessLog } from './middleware/accessLog';
import { corsOptions } from './middleware/corsOptions';
import { initSessionLimiter, getJwtLimiter } from './middleware/rateLimit';
import { BOTS } from './config/bots';

export function buildApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(requestId);
  app.use(accessLog);
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/init-session', initSessionLimiter);
  app.use('/api/get-jwt', getJwtLimiter);

  app.use(legacyRouter);

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Epson Kore JWT Service',
      port: config.port,
      bots: Object.keys(BOTS),
    });
  });

  app.get('/api/v2/health', async (_req: Request, res: Response) => {
    try {
      const pong = await redis.ping();
      const healthy = pong === 'PONG';
      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        redis: healthy ? 'up' : 'down',
      });
    } catch (err) {
      res.status(503).json({
        status: 'degraded',
        redis: 'down',
        error: (err as Error).message,
      });
    }
  });

  app.use(sessionRouter);
  app.use(jwtRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', path: req.path });
  });

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err.message === 'CORS_ORIGIN_NOT_ALLOWED') {
      res.status(403).json({ error: 'CORS_ORIGIN_NOT_ALLOWED' });
      return;
    }
    log.error('Unhandled error', { reqId: req.id, error: err.message });
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  });

  return app;
}
