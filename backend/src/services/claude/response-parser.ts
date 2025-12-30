/**
 * @file services/claude/response-parser.ts
 * @purpose Claude API response parsing and validation
 * @functionality
 * - Extracts text content from Claude messages
 * - Parses analysis JSON responses
 * @dependencies
 * - @anthropic-ai/sdk for Message type
 * - @/utils/json-validator for JSON parsing
 * - @/types/claude.types for result types
 */

import type Anthropic from '@anthropic-ai/sdk';
import { parseAiJsonResponse, type JsonParseResult } from '@/utils';
import type { AIAnalysisResult } from '@/types';

/**
 * Extracts text content from Claude message
 */
export function extractTextFromMessage(message: Anthropic.Message): string | null {
  const textBlock = message.content.find((block) => block.type === 'text');
  return textBlock?.text ?? null;
}

/**
 * Parses Claude analysis response into typed result
 */
export function parseAnalysisResponse(rawText: string): JsonParseResult<AIAnalysisResult> {
  return parseAiJsonResponse<AIAnalysisResult>(rawText);
}
