/**
 * @file routes/index.ts
 * @purpose Main route aggregator with API versioning
 * @functionality
 * - Mounts versioned API routes
 * - Provides base health endpoint at root
 * @dependencies
 * - express.Router
 * - ./api/v1
 */

import { Router } from 'express';
import v1Routes from './api/v1/index.js';

const router = Router();

// API v1 routes
router.use('/api/v1', v1Routes);

// Convenience: root health check redirects to v1
router.get('/health', (_req, res) => {
  res.redirect('/api/v1/health');
});

export default router;
