/**
 * @file prompt-service/src/admin/index.ts
 * @purpose Main barrel export for admin module
 * @functionality
 * - Re-exports all admin types
 * - Re-exports API clients and utilities
 * - Re-exports React hooks
 * - Re-exports UI components
 * - Re-exports page components
 * - Re-exports styling utilities
 * @dependencies
 * - ./types
 * - ./api
 * - ./hooks
 * - ./components
 * - ./pages
 * - ./styles
 */

// Types
export type {
  PromptVariantDTO,
  PromptDTO,
  PromptVersionDTO,
  CreatePromptInput,
  UpdatePromptInput,
  ABVariantConfigDTO,
  ABVariantDTO,
  ABTestDTO,
  CreateABTestInput,
  UpdateABTestInput,
  CreateABVariantInput,
  UpdateABVariantInput,
  ApiError,
} from './types';
export { CLAUDE_MODELS } from './types';

// API
export * from './api'; // @allow-wildcard

// Hooks
export * from './hooks'; // @allow-wildcard

// Components
export * from './components'; // @allow-wildcard

// Pages
export * from './pages'; // @allow-wildcard

// Styles
export * from './styles'; // @allow-wildcard

// App
export { App } from './App';
