/**
 * @file routes/health.routes.ts
 * @purpose Health and readiness check endpoints for container orchestration
 * @functionality
 * - GET /health - Basic liveness check for Docker/K8s probes
 * - GET /health/ready - Readiness check with dependency verification
 * @dependencies
 * - express.Router
 * - @/controllers/health.controller
 */

import { Router } from 'express';
import { liveness, readiness } from '@/controllers';

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
router.get('/ready', (req, res, next) => {
  readiness(req, res).catch(next);
});

export default router;
