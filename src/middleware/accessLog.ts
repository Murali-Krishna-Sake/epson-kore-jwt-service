import { RequestHandler } from 'express';
import { log } from '../utils/logger';

export const accessLog: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    if (res.statusCode < 400) return;
    const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
    const level = res.statusCode >= 500 ? 'error' : 'warn';
    log[level]('request', {
      reqId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
};
