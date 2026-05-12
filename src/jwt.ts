import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import type { BotConfig } from './config/bots';

const KORE_AUDIENCE = 'https://idproxy.kore.com/authorize';

export interface IssueInput {
  bot: BotConfig;
  sub: string;
  sessionId: string;
}

interface KoreClaims {
  sub: string;
  iss: string;
  appId: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
  isAnonymous: boolean;
  sessionId: string;
}

async function loadKoreKey() {
  const { importJWK } = await import('jose');
  return importJWK(config.koreJwk, 'RSA-OAEP');
}

let koreKeyPromise: ReturnType<typeof loadKoreKey> | null = null;

function getKoreKey(): ReturnType<typeof loadKoreKey> {
  if (!koreKeyPromise) {
    koreKeyPromise = loadKoreKey();
  }
  return koreKeyPromise;
}

function buildClaims(input: IssueInput): KoreClaims {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: input.sub,
    iss: input.bot.clientId,
    appId: input.bot.clientId,
    aud: KORE_AUDIENCE,
    iat: now,
    exp: now + config.jwtExpirySec,
    jti: uuidv4(),
    isAnonymous: true,
    sessionId: input.sessionId,
  };
}

export async function issueKoreJwt(input: IssueInput): Promise<string> {
  const { CompactEncrypt } = await import('jose');
  const claims = buildClaims(input);
  const signedJwt = jwt.sign(claims, input.bot.clientSecret, { algorithm: 'HS256' });
  const key = await getKoreKey();

  return new CompactEncrypt(new TextEncoder().encode(signedJwt))
    .setProtectedHeader({
      alg: 'RSA-OAEP',
      enc: 'A256GCM',
      cty: 'JWT',
      kid: config.koreJwk.kid,
    })
    .encrypt(key);
}
