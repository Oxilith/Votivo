/**
 * @file prompt-service/src/controllers/index.ts
 * @purpose Centralized export for all controller modules
 * @functionality
 * - Exports prompt controller
 * - Exports A/B test controller
 * - Exports resolve controller
 * - Exports user auth controller
 * @dependencies
 * - prompt.controller.ts
 * - ab-test.controller.ts
 * - resolve.controller.ts
 * - user-auth.controller.ts
 */

export { PromptController, promptController } from './prompt.controller';
export { ABTestController, abTestController } from './ab-test.controller';
export { ResolveController, resolveController } from './resolve.controller';
export { UserAuthController, userAuthController } from './user-auth.controller';
