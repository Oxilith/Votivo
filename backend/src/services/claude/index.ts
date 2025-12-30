/**
 * @file backend/src/services/claude/index.ts
 * @purpose Barrel export for Claude API utilities
 * @functionality
 * - Exports response parsing utilities
 * @dependencies
 * - ./response-parser
 */

export { extractTextFromMessage, parseAnalysisResponse } from './response-parser';
