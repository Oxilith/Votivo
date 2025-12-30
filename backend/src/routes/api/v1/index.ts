/**
 * @file routes/api/v1/index.ts
 * @purpose Aggregates all v1 API routes
 * @functionality
 * - Combines all v1 route modules
 * - Provides single export for app.ts
 * @dependencies
 * - express.Router
 * - ./claude.routes
 */

import { Router } from 'express';
import claudeRoutes from './claude.routes';

const router = Router();

router.use('/claude', claudeRoutes);

export default router;
