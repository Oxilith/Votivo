/**
 * @file middleware/cors.middleware.ts
 * @purpose CORS configuration middleware for Express
 * @functionality
 * - Configures allowed origins for cross-origin requests
 * - Sets appropriate CORS headers
 * - Handles preflight OPTIONS requests
 * @dependencies
 * - cors middleware package
 * - @/config for CORS origin configuration
 */

import cors from 'cors';
import { config } from '@/config';

export const corsMiddleware = cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
