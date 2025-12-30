/**
 * @file prompt-service/src/routes/resolve.routes.ts
 * @purpose Express router for prompt resolution endpoints (internal API)
 * @functionality
 * - Defines route for prompt configuration resolution
 * - Route for conversion tracking
 * - Used by the main backend service
 * @dependencies
 * - express Router
 * - @/controllers/resolve.controller for request handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { resolveController } from '@/controllers';

const router = Router();

// Async wrapper to catch errors
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

// Resolution routes
router.post('/', asyncHandler(resolveController.resolve.bind(resolveController)));
router.post(
  '/:variantId/conversion',
  asyncHandler(resolveController.recordConversion.bind(resolveController))
);

export { router as resolveRoutes };
