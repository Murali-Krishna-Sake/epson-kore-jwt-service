import { v4 as uuidv4 } from 'uuid';
import { redis } from './redis';
import { config } from '../config/config';
import { log } from '../utils/logger';

export interface SessionData {
  fpHash: string;
  deviceUUID: string;
}

export interface CreatedSession {
  sessionId: string;
  deviceUUID: string;
}

const SESSION_KEY_PREFIX = 'session:tab:';

function key(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export async function createSession(fpHash: string): Promise<CreatedSession> {
  const sessionId = uuidv4();
  const deviceUUID = uuidv4();
  const payload: SessionData = { fpHash, deviceUUID };

  await redis.set(key(sessionId), JSON.stringify(payload), 'EX', config.sessionTtlSec);
  return { sessionId, deviceUUID };
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const raw = await redis.get(key(sessionId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionData;
    if (typeof parsed.fpHash !== 'string' || typeof parsed.deviceUUID !== 'string') {
      log.warn('Session record malformed', { sessionId });
      return null;
    }
    return parsed;
  } catch (err) {
    log.warn('Session record unreadable', { sessionId, error: (err as Error).message });
    return null;
  }
}

export async function touchSession(sessionId: string): Promise<void> {
  await redis.expire(key(sessionId), config.sessionTtlSec);
}
