/**
 * @file routes/index.ts
 * @purpose Main route aggregator with API versioning
 * @functionality
 * - Mounts versioned API routes
 * - Provides health endpoints for Docker/K8s liveness and readiness probes
 * @dependencies
 * - express.Router
 * - ./api (barrel)
 * - ./health.routes
 */

import { Router } from 'express';
import { v1Routes } from './api';
import healthRoutes from './health.routes';

const router = Router();

// API v1 routes
router.use('/api/v1', v1Routes);

// Health endpoints for container orchestration
router.use('/health', healthRoutes);

export default router;
