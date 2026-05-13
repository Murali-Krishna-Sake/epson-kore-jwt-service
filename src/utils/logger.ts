type Level = 'debug' | 'info' | 'warn' | 'error';

type Meta = Record<string, unknown>;

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const THRESHOLD = ORDER[(process.env.LOG_LEVEL as Level) in ORDER
  ? (process.env.LOG_LEVEL as Level)
  : 'warn'];

function format(level: Level, msg: string, meta?: Meta): string {
  const tail = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${msg}${tail}`;
}

function emit(level: Level, msg: string, meta?: Meta): void {
  if (ORDER[level] < THRESHOLD) return;
  const line = format(level, msg, meta);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, meta?: Meta): void => emit('debug', msg, meta),
  info: (msg: string, meta?: Meta): void => emit('info', msg, meta),
  warn: (msg: string, meta?: Meta): void => emit('warn', msg, meta),
  error: (msg: string, meta?: Meta): void => emit('error', msg, meta),
};
