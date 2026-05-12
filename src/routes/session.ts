import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { createSession } from '../store/sessionStore';
import { log } from '../utils/logger';

interface InitSessionBody {
  fp?: unknown;
}

const FP_PATTERN = /^[0-9a-f]{64}$/;

export const sessionRouter = Router();

sessionRouter.post(
  '/init-session',
  async (req: Request<unknown, unknown, InitSessionBody>, res: Response): Promise<void> => {
    const { fp } = req.body;

    if (typeof fp !== 'string' || fp.length === 0) {
      res.status(400).json({ error: 'MISSING_FP' });
      return;
    }

    if (!FP_PATTERN.test(fp)) {
      res.status(400).json({ error: 'INVALID_FP' });
      return;
    }

    try {
      const fpHash = crypto.createHash('sha256').update(fp).digest('hex');
      const { sessionId } = await createSession(fpHash);
      res.status(200).json({ sessionId });
    } catch (err) {
      log.error('init-session error', { error: (err as Error).message });
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
