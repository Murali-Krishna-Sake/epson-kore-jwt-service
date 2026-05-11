import Redis from 'ioredis';
import { config } from './config';
import { log } from './logger';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => {
  log.info('Redis connecting');
});

redis.on('ready', () => {
  log.info('Redis ready');
});

redis.on('error', (err: Error) => {
  log.error('Redis error', { error: err.message });
});

redis.on('close', () => {
  log.warn('Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  log.info('Redis reconnecting', { delayMs: delay });
});

export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
    log.info('Redis client quit cleanly');
  } catch (err) {
    log.error('Error closing Redis', { error: (err as Error).message });
    redis.disconnect();
  }
}
