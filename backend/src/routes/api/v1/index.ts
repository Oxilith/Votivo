/**
 * @file routes/api/v1/index.ts
 * @purpose Aggregates all v1 API routes
 * @functionality
 * - Combines all v1 route modules
 * - Provides single export for app.ts
 * @dependencies
 * - express.Router
 * - ./claude.routes
 * - ./health.routes
 */

import { Router } from 'express';
import claudeRoutes from './claude.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/claude', claudeRoutes);
router.use('/health', healthRoutes);

export default router;
