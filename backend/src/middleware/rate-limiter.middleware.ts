/**
 * @file middleware/rate-limiter.middleware.ts
 * @purpose Rate limiting middleware to prevent API abuse
 * @functionality
 * - Limits requests per IP address within time window
 * - Returns 429 Too Many Requests when limit exceeded
 * - Configurable via environment variables
 * @dependencies
 * - express-rate-limit package
 * - @/config for rate limit configuration
 */

import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// Stricter rate limiter for Claude API calls (configurable)
export const claudeRateLimiter = rateLimit({
  windowMs: config.claudeRateLimitWindowMs,
  limit: config.claudeRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many analysis requests, please wait before trying again.',
    },
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  keyGenerator: (req) => req.ip ?? 'unknown',
});
