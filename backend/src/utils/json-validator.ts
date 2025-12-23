/**
 * @file utils/json-validator.ts
 * @purpose Generic JSON parsing and validation utilities
 * @functionality
 * - Parses JSON strings with error handling
 * - Strips markdown code blocks from AI responses
 * - Provides type-safe parsing results
 * @dependencies
 * - None (pure utility)
 */

export interface JsonParseSuccess<T> {
  success: true;
  data: T;
}

export interface JsonParseError {
  success: false;
  error: Error;
}

export type JsonParseResult<T> = JsonParseSuccess<T> | JsonParseError;

/**
 * Strips markdown code block formatting from text
 */
export function stripMarkdownCodeBlocks(text: string): string {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

/**
 * Safely parses JSON with proper error handling
 */
export function parseJson<T>(text: string): JsonParseResult<T> {
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Parses JSON from AI response, stripping markdown formatting
 */
export function parseAiJsonResponse<T>(rawText: string): JsonParseResult<T> {
  const cleanText = stripMarkdownCodeBlocks(rawText);
  return parseJson<T>(cleanText);
}
