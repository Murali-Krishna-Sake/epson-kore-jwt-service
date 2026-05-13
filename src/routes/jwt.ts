import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getSession, touchSession } from '../store/sessionStore';
import { issueKoreJwt } from '../services/jwt';
import { BOTS } from '../config/bots';
import { log } from '../utils/logger';

interface GetJwtBody {
  identity?: unknown;
}

interface GetJwtQuery {
  app?: string;
}

export const jwtRouter = Router();

jwtRouter.post(
  '/get-jwt',
  async (
    req: Request<unknown, unknown, GetJwtBody, GetJwtQuery>,
    res: Response,
  ): Promise<void> => {
    const appCode = req.query.app;
    if (typeof appCode !== 'string' || appCode.length === 0) {
      res.status(400).json({ error: 'INVALID_APP' });
      return;
    }

    const bot = BOTS[appCode];
    if (!bot) {
      res.status(400).json({ error: 'INVALID_APP' });
      return;
    }

    const rawIdentity = req.body.identity;

    if (typeof rawIdentity !== 'string') {
      res.status(400).json({ error: 'INVALID_IDENTITY' });
      return;
    }

    const colonIdx = rawIdentity.indexOf(':');
    if (colonIdx <= 0 || colonIdx === rawIdentity.length - 1) {
      res.status(400).json({ error: 'INVALID_IDENTITY' });
      return;
    }

    const tabId = rawIdentity.substring(0, colonIdx);
    const sentFp = rawIdentity.substring(colonIdx + 1);

    try {
      const session = await getSession(tabId);
      if (!session) {
        res.status(401).json({ error: 'SESSION_EXPIRED' });
        return;
      }

      const sentFpHash = crypto.createHash('sha256').update(sentFp).digest('hex');
      if (session.fpHash !== sentFpHash) {
        log.warn('get-jwt: fp mismatch', { appCode, tabId });
        res.status(401).json({ error: 'FP_MISMATCH' });
        return;
      }

      await touchSession(tabId);
      const token = await issueKoreJwt({
        bot,
        sub: session.deviceUUID,
        sessionId: tabId,
      });
      res.status(200).json({ jwt: token });
    } catch (err) {
      log.error('get-jwt error', { appCode, error: (err as Error).message });
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
