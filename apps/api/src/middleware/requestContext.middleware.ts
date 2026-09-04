import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

/** Paths that would otherwise flood the log with uptime-probe noise. */
const QUIET_PATHS = new Set(['/health/check', '/health/live', '/health/ready', '/favicon.ico']);

/**
 * Stamps every request with an id, echoes it back on the response, and writes one
 * access line when the response finishes. The id is what ties a user-visible
 * "Server error, please try again later" to the stack trace in the logs.
 */
export default function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  if (QUIET_PATHS.has(req.path)) return next();

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const context = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.user?.userId,
      storeCode: req.user?.storeCode ?? undefined,
    };

    if (res.statusCode >= 500) logger.error('request failed', context);
    else if (res.statusCode >= 400) logger.warn('request rejected', context);
    else logger.info('request', context);
  });

  next();
}
