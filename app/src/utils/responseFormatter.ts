/**
 * @file src/utils/responseFormatter.ts
 * @purpose Re-exports shared response formatting utilities for frontend use
 * @functionality
 * - Re-exports formatResponsesForPrompt from shared
 * - Re-exports label mappings for use in components
 * - Maintains backward compatibility for existing imports
 * @dependencies
 * - @shared/index (formatResponsesForPrompt, label mappings)
 */

// Re-export labels for components that import from this file
export { valueLabels, timeLabels, triggerLabels, willpowerLabels } from 'shared';

// Re-export formatter from shared (now with language parameter)
export { formatResponsesForPrompt } from 'shared';
