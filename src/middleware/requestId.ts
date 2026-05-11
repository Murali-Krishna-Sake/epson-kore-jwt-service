import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
  }
}

const MAX_HEADER_LEN = 128;

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const safe =
    typeof incoming === 'string' && incoming.length > 0 && incoming.length <= MAX_HEADER_LEN
      ? incoming
      : uuidv4();

  req.id = safe;
  res.setHeader('X-Request-Id', safe);
  next();
};
