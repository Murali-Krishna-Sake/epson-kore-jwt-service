import http from 'http';
import { buildApp } from './app';
import { config } from './config';
import { log } from './logger';
import { closeRedis } from './redis';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = buildApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  log.info('JWT service listening', { port: config.port });
});

server.on('error', (err: Error) => {
  log.error('HTTP server error', { error: err.message });
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    log.warn('Shutdown already in progress; ignoring signal', { signal });
    return;
  }
  shuttingDown = true;
  log.info('Shutdown initiated', { signal });

  const forceExit = setTimeout(() => {
    log.error('Shutdown timed out; forcing exit', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    log.info('HTTP server closed');
  } catch (err) {
    log.error('Error closing HTTP server', { error: (err as Error).message });
  }

  await closeRedis();
  log.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('uncaughtException', (err: Error) => {
  log.error('uncaughtException', { error: err.message, stack: err.stack });
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  log.error('unhandledRejection', { reason: msg });
  void shutdown('unhandledRejection');
});
