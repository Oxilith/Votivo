/**
 * @file prompt-service/src/routes/prompt.routes.ts
 * @purpose Express router for prompt management endpoints
 * @functionality
 * - Defines routes for prompt CRUD operations
 * - Routes for version history and restore
 * - Wraps controller methods with async error handling
 * @dependencies
 * - express Router
 * - @/controllers/prompt.controller for request handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { promptController } from '@/controllers';

const router = Router();

// Async wrapper to catch errors
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

// Prompt CRUD routes
router.get('/', asyncHandler(promptController.getAll.bind(promptController)));
router.get('/key/:key', asyncHandler(promptController.getByKey.bind(promptController)));
router.get('/:id', asyncHandler(promptController.getById.bind(promptController)));
router.post('/', asyncHandler(promptController.create.bind(promptController)));
router.put('/:id', asyncHandler(promptController.update.bind(promptController)));
router.delete('/:id', asyncHandler(promptController.delete.bind(promptController)));

// Version history routes
router.get('/:id/versions', asyncHandler(promptController.getVersions.bind(promptController)));
router.post(
  '/:id/versions/:versionId/restore',
  asyncHandler(promptController.restoreVersion.bind(promptController))
);

export { router as promptRoutes };
