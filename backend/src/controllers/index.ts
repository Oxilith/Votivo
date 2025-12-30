/**
 * @file src/controllers/index.ts
 * @purpose Centralized export for all controller modules
 * @functionality
 * - Exports Claude analysis controller
 * - Exports health check controllers
 * @dependencies
 * - claude.controller.ts
 * - health.controller.ts
 */

export { analyze } from './claude.controller';
export { liveness, readiness } from './health.controller';
