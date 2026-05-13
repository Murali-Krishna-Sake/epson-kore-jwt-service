// Old /api/health and /api/sts endpoints. Remove once no traffic hits them.

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { log } from '../utils/logger';

const LEGACY_BOT_IDS = ['na-customer', 'la-customer', 'brazil-customer', 'na-agent'] as const;
type LegacyBotId = (typeof LEGACY_BOT_IDS)[number];

const LEGACY_ENV_PREFIX: Record<LegacyBotId, string> = {
  'na-customer': 'BOT_NA_CUSTOMER',
  'la-customer': 'BOT_LA_CUSTOMER',
  'brazil-customer': 'BOT_BRAZIL_CUSTOMER',
  'na-agent': 'BOT_NA_AGENT',
};

const DEFAULT_EXPIRY_SEC = 3500;

interface LegacyCreds {
  secret: string;
  issuer: string;
  audience: string;
  expirySec: number;
}

function getLegacyCreds(botId: string): LegacyCreds | null {
  if (!(LEGACY_BOT_IDS as readonly string[]).includes(botId)) return null;
  const prefix = LEGACY_ENV_PREFIX[botId as LegacyBotId];
  const secret = process.env[`${prefix}_JWT_SECRET`];
  const issuer = process.env[`${prefix}_JWT_ISSUER`];
  const audience = process.env[`${prefix}_JWT_AUDIENCE`];
  const expiryRaw = process.env[`${prefix}_JWT_EXPIRY`];
  if (!secret || !issuer || !audience) return null;
  const expirySec = expiryRaw ? parseInt(expiryRaw, 10) : DEFAULT_EXPIRY_SEC;
  return { secret, issuer, audience, expirySec };
}

interface LegacyStsBody {
  bot?: unknown;
  identity?: unknown;
  userId?: unknown;
  aud?: unknown;
  isAnonymous?: unknown;
}

interface LegacyStsQuery {
  bot?: string;
}

export const legacyRouter = Router();

legacyRouter.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

legacyRouter.post(
  '/api/sts',
  (req: Request<unknown, unknown, LegacyStsBody, LegacyStsQuery>, res: Response): void => {
    const rawBot = req.query.bot ?? req.body.bot;
    if (typeof rawBot !== 'string' || rawBot.trim() === '') {
      res.status(400).json({
        error: `Missing bot identifier. Valid ids: ${LEGACY_BOT_IDS.join(', ')}`,
      });
      return;
    }

    const botId = rawBot.trim().toLowerCase();
    const creds = getLegacyCreds(botId);
    if (!creds) {
      res.status(400).json({
        error: `Invalid bot. Valid ids: ${LEGACY_BOT_IDS.join(', ')}`,
      });
      return;
    }

    const sub =
      typeof req.body.identity === 'string'
        ? req.body.identity
        : typeof req.body.userId === 'string'
          ? req.body.userId
          : null;

    if (!sub) {
      res.status(400).json({ error: 'Invalid or missing identity' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const aud = typeof req.body.aud === 'string' ? req.body.aud : creds.audience;
    const payload = {
      sub,
      iss: creds.issuer,
      aud,
      iat: now,
      exp: now + creds.expirySec,
      isAnonymous: !!req.body.isAnonymous,
    };

    try {
      const token = jwt.sign(payload, creds.secret, { algorithm: 'HS256' });
      res.json({ jwt: token });
    } catch (err) {
      log.error('legacy /api/sts signing error', { error: (err as Error).message });
      res.status(500).json({ error: 'Failed to sign token' });
    }
  },
);
