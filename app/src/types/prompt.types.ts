/**
 * @file src/types/prompt.types.ts
 * @purpose Type definitions for AI prompt configuration
 * @functionality
 * - Defines ClaudeModel const object for available model options
 * - Defines PromptConfig interface for prompt settings
 * - Provides type safety for AI API calls
 * @dependencies
 * - None
 */

export const ClaudeModel = {
  SONNET_4_0: 'claude-sonnet-4-0',
  SONNET_4_5: 'claude-sonnet-4-5',
  OPUS_4_5: 'claude-opus-4-5',
  SONNET_3_7_LATEST: 'claude-3-7-sonnet-latest',
  HAIKU_3_5_LATEST: 'claude-3-5-haiku-latest',
} as const;

export type ClaudeModel = (typeof ClaudeModel)[keyof typeof ClaudeModel];

export interface ThinkingParams {
    type: string;
    budget_tokens: number; // integer
}

export interface PromptConfig {
  prompt: string;
  temperature: number; // 0 to 1
  model: ClaudeModel;
  max_tokens: number; // integer
  thinking_params?: ThinkingParams;
}
