import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getSession, touchSession } from '../sessionStore';
import { issueKoreJwt } from '../jwt';
import { log } from '../logger';

interface GetJwtBody {
  identity?: unknown;
}

export const jwtRouter = Router();

jwtRouter.post(
  '/get-jwt',
  async (req: Request<unknown, unknown, GetJwtBody>, res: Response): Promise<void> => {
    const rawIdentity = req.body.identity;

    if (typeof rawIdentity !== 'string') {
      log.warn('get-jwt rejected: missing identity');
      res.status(400).json({ error: 'INVALID_IDENTITY' });
      return;
    }

    const colonIdx = rawIdentity.indexOf(':');
    if (colonIdx <= 0 || colonIdx === rawIdentity.length - 1) {
      log.warn('get-jwt rejected: malformed identity');
      res.status(400).json({ error: 'INVALID_IDENTITY' });
      return;
    }

    const tabId = rawIdentity.substring(0, colonIdx);
    const sentFp = rawIdentity.substring(colonIdx + 1);

    try {
      const session = await getSession(tabId);
      if (!session) {
        log.info('get-jwt: session expired', { tabId });
        res.status(401).json({ error: 'SESSION_EXPIRED' });
        return;
      }

      const sentFpHash = crypto.createHash('sha256').update(sentFp).digest('hex');
      if (session.fpHash !== sentFpHash) {
        log.warn('get-jwt: fp mismatch', { tabId });
        res.status(401).json({ error: 'FP_MISMATCH' });
        return;
      }

      await touchSession(tabId);
      const token = await issueKoreJwt({
        sub: session.deviceUUID,
        sessionId: tabId,
      });
      res.status(200).json({ jwt: token });
    } catch (err) {
      log.error('get-jwt error', { error: (err as Error).message });
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
