/**
 * @file prompt-service/src/admin/hooks/index.ts
 * @purpose Barrel export for admin React hooks
 * @functionality
 * - Exports prompt data hooks (usePrompts, usePrompt, usePromptVersions)
 * - Exports A/B test data hooks (useABTests, useABTest)
 * @dependencies
 * - ./usePrompts
 * - ./useABTests
 */

export { usePrompts, usePrompt, usePromptVersions } from './usePrompts';
export { useABTests, useABTest } from './useABTests';
