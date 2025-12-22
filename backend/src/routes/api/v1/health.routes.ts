/**
 * @file routes/api/v1/health.routes.ts
 * @purpose Health and readiness check endpoints
 * @functionality
 * - GET /health - Basic liveness check
 * - GET /health/ready - Readiness with dependency checks
 * @dependencies
 * - express.Router
 * - @/controllers/health.controller
 */

import { Router } from 'express';
import { liveness, readiness } from '../../../controllers/health.controller.js';

const router = Router();

/**
 * GET /health
 * Basic liveness check - returns 200 if server is running
 */
router.get('/', liveness);

/**
 * GET /health/ready
 * Readiness check - verifies all dependencies are available
 */
router.get('/ready', (req, res) => {
  readiness(req, res);
});

export default router;
