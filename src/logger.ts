type Level = 'info' | 'warn' | 'error' | 'debug';

type Meta = Record<string, unknown>;

function ts(): string {
  return new Date().toISOString();
}

function format(level: Level, msg: string, meta?: Meta): string {
  const tail = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${ts()} ${level.toUpperCase().padEnd(5)} ${msg}${tail}`;
}

export const log = {
  info: (msg: string, meta?: Meta): void => {
    console.log(format('info', msg, meta));
  },
  warn: (msg: string, meta?: Meta): void => {
    console.warn(format('warn', msg, meta));
  },
  error: (msg: string, meta?: Meta): void => {
    console.error(format('error', msg, meta));
  },
  debug: (msg: string, meta?: Meta): void => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(format('debug', msg, meta));
    }
  },
};
