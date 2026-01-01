/**
 * @file shared/src/prompt.types.ts
 * @purpose Type definitions for AI prompt configuration
 * @functionality
 * - Defines ClaudeModel const object for available model options
 * - Uses ThinkingConfigParam from official Anthropic SDK
 * - Defines PromptConfig interface for prompt settings
 * - Defines PromptConfigKey type for prompt identifiers
 * - Provides type safety for AI API calls across app and backend
 * @dependencies
 * - @anthropic-ai/sdk for ThinkingConfigParam type
 */

import type { ThinkingConfigParam } from '@anthropic-ai/sdk/resources/messages';

export const ClaudeModel = {
  SONNET_4_0: 'claude-sonnet-4-0',
  SONNET_4_5: 'claude-sonnet-4-5',
  OPUS_4_5: 'claude-opus-4-5',
  SONNET_3_7_LATEST: 'claude-3-7-sonnet-latest',
  HAIKU_3_5_LATEST: 'claude-3-5-haiku-latest',
} as const;

export type ClaudeModel = (typeof ClaudeModel)[keyof typeof ClaudeModel];

export type { ThinkingConfigParam };

/**
 * Key identifiers for prompt configurations stored in the prompt-service database
 */
export type PromptConfigKey = 'IDENTITY_ANALYSIS';

export interface PromptConfig {
  prompt: string;
  temperature: number;
  model: ClaudeModel;
  max_tokens: number;
  thinking?: ThinkingConfigParam;
}

export interface ThinkingVariant {
    temperature: number;
    max_tokens: number;
    thinking: ThinkingConfigParam;
}

export interface PromptConfigDefinition {
    model: ClaudeModel;
    prompt: string;
    variants: {
        withThinking: ThinkingVariant;
        withoutThinking: ThinkingVariant;
    };
}