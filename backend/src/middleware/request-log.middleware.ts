import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
export const requestLog: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  const start = performance.now();
  res.locals.requestId = requestId;
  res.set('X-Request-ID', requestId);
  res.on('finish', () =>
    console.log(
      JSON.stringify({
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - start),
      }),
    ),
  );
  next();
};
