import rateLimit, { ipKeyGenerator, Options } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { log } from '../utils/logger';

const baseOptions: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log.warn('rate limit exceeded', {
      reqId: req.id,
      path: req.path,
      ip: req.ip,
    });
    res.status(429).json({ error: 'RATE_LIMITED' });
  },
};

export const initSessionLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  limit: 20,
});

export const getJwtLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60_000,
  limit: 40,
  keyGenerator: (req: Request): string => {
    const ip = ipKeyGenerator(req.ip ?? '');
    const rawIdentity = (req.body as { identity?: unknown } | undefined)?.identity;
    if (typeof rawIdentity === 'string') {
      const colonIdx = rawIdentity.indexOf(':');
      const tabId = colonIdx > 0 ? rawIdentity.substring(0, colonIdx) : rawIdentity;
      return `${ip}:${tabId}`;
    }
    return ip;
  },
});
