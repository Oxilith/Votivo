/**
 * @file middleware/index.ts
 * @purpose Aggregates and exports all middleware modules
 * @functionality
 * - Provides centralized export for all middleware
 * - Simplifies imports in app.ts
 * @dependencies
 * - All middleware modules in this directory
 */

export { corsMiddleware } from './cors.middleware.js';
export { rateLimiter, claudeRateLimiter } from './rate-limiter.middleware.js';
export { errorHandler, notFoundHandler, createAppError, type AppError } from './error.middleware.js';
