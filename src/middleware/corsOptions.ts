import { CorsOptions } from 'cors';
import { config } from '../config/config';
import { log } from '../utils/logger';

const LOCAL_DEV_PREFIXES = ['http://localhost:', 'http://127.0.0.1:'];

function isLocalDevOrigin(origin: string): boolean {
  return LOCAL_DEV_PREFIXES.some((prefix) => origin.startsWith(prefix));
}

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }

    if (isLocalDevOrigin(origin) || config.allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    log.warn('CORS blocked', { origin });
    cb(new Error('CORS_ORIGIN_NOT_ALLOWED'));
  },
};
