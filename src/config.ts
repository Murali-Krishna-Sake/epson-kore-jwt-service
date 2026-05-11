import 'dotenv/config';
import type { JWK } from 'jose';
import { log } from './logger';

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    log.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function parseKoreJwk(raw: string): JWK & { kid: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    log.error('KORE_JWK is not valid JSON', { error: (e as Error).message });
    process.exit(1);
  }

  if (!parsed || typeof parsed !== 'object') {
    log.error('KORE_JWK must be a JSON object');
    process.exit(1);
  }

  const jwk = parsed as Record<string, unknown>;
  if (typeof jwk.kty !== 'string' || typeof jwk.kid !== 'string') {
    log.error('KORE_JWK is missing required fields (kty, kid)');
    process.exit(1);
  }

  return jwk as unknown as JWK & { kid: string };
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || n > 65535) {
    log.error(`Invalid PORT: ${raw}`);
    process.exit(1);
  }
  return n;
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: parsePort(process.env.PORT, 3001),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  clientId: required('CLIENT_ID'),
  clientSecret: required('CLIENT_SECRET'),
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  koreJwk: parseKoreJwk(required('KORE_JWK')),
  sessionTtlSec: 30 * 24 * 3600,
  jwtExpirySec: 300,
} as const;

export type AppConfig = typeof config;
