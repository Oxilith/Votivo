/**
 * @file routes/api/v1/claude.routes.ts
 * @purpose Express routes for Claude API proxy
 * @functionality
 * - POST /analyze - Identity analysis endpoint
 * - Applies Claude-specific rate limiting
 * @dependencies
 * - express.Router
 * - @/controllers/claude.controller
 * - @/middleware/rate-limiter.middleware
 */

import { Router } from 'express';
import { analyze } from '@/controllers';
import { claudeRateLimiter } from '@/middleware';

const router = Router();

/**
 * POST /api/v1/claude/analyze
 * Analyze assessment responses using Claude AI
 */
router.post('/analyze', claudeRateLimiter, (req, res, next) => {
  void analyze(req, res, next);
});

export default router;
