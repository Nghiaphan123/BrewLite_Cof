import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { isSafeRequestId } from './redact.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id') ?? '';
  const requestId = isSafeRequestId(incoming) ? incoming : randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export function requestIdFrom(req: Request): string {
  const value = req.headers['x-request-id'];
  return typeof value === 'string' && value.length > 0 ? value : 'unknown';
}
