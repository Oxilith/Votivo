/**
 * @file prompt-service/src/middleware/tracing.middleware.ts
 * @purpose W3C Trace Context middleware for distributed tracing
 * @functionality
 * - Extracts or creates W3C traceparent from request headers
 * - Attaches trace context to request for downstream propagation
 * - Adds traceparent header to response for client debugging
 * - Enhances pino logger with trace context fields
 * @dependencies
 * - shared/index for W3C tracing utilities
 * - express types for middleware signature
 */

import type { Request, Response, NextFunction } from 'express';
import { TRACEPARENT_HEADER, extractOrCreateTrace, type TraceInfo } from 'shared';

/**
 * Extend Express Request to include trace context
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      traceContext?: TraceInfo;
    }
  }
}

/**
 * Tracing middleware that extracts or creates W3C trace context
 *
 * This middleware should be applied early in the middleware chain,
 * before pino-http, to ensure all logging includes trace context.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const trace = extractOrCreateTrace(req.headers as Record<string, string | undefined>);

  // Attach to request for logging and downstream propagation
  req.traceContext = trace;

  // Add to response headers for client debugging
  res.setHeader(TRACEPARENT_HEADER, trace.traceparent);

  next();
}
