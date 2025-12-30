/**
 * @file prompt-service/src/routes/ab-test.routes.ts
 * @purpose Express router for A/B test management endpoints
 * @functionality
 * - Defines routes for A/B test CRUD operations
 * - Routes for activation/deactivation
 * - Routes for variant management
 * - Wraps controller methods with async error handling
 * @dependencies
 * - express Router
 * - @/controllers/ab-test.controller for request handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { abTestController } from '@/controllers';

const router = Router();

// Async wrapper to catch errors
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

// A/B Test CRUD routes
router.get('/', asyncHandler(abTestController.getAll.bind(abTestController)));
router.get('/:id', asyncHandler(abTestController.getById.bind(abTestController)));
router.post('/', asyncHandler(abTestController.create.bind(abTestController)));
router.put('/:id', asyncHandler(abTestController.update.bind(abTestController)));
router.delete('/:id', asyncHandler(abTestController.delete.bind(abTestController)));

// Activation routes
router.post('/:id/activate', asyncHandler(abTestController.activate.bind(abTestController)));
router.post('/:id/deactivate', asyncHandler(abTestController.deactivate.bind(abTestController)));

// Variant routes
router.post('/:id/variants', asyncHandler(abTestController.addVariant.bind(abTestController)));
router.put(
  '/:id/variants/:variantId',
  asyncHandler(abTestController.updateVariant.bind(abTestController))
);
router.delete(
  '/:id/variants/:variantId',
  asyncHandler(abTestController.removeVariant.bind(abTestController))
);

export { router as abTestRoutes };
