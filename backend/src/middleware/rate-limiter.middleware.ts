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
import { config } from '../config/index.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
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

// Stricter rate limiter for Claude API calls
export const claudeRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 requests per minute (Claude is expensive)
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
