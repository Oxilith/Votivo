/**
 * @file src/config/prompts.ts
 * @purpose Configuration for AI prompts used throughout the application
 * @functionality
 * - Imports shared prompt from @shared/index
 * - Defines prompt configurations with model settings
 * - Provides centralized prompt management
 * - Ensures consistent AI behavior across features
 * @dependencies
 * - @shared/index for IDENTITY_ANALYSIS_PROMPT
 * - @/types/prompt.types (ClaudeModel, PromptConfig)
 */

import { ClaudeModel, type PromptConfig, type ThinkingParams } from '@/types/prompt.types';
import { IDENTITY_ANALYSIS_PROMPT } from '@shared/index';

const thinking_params: ThinkingParams = {
  type: 'enabled',
  budget_tokens: 10000,
};

export const IDENTITY_ANALYSIS_CONFIG: PromptConfig = {
  model: ClaudeModel.SONNET_4_5,
  temperature: 0.6,
  max_tokens: 8000,
  thinking_params: thinking_params,
  prompt: IDENTITY_ANALYSIS_PROMPT,
};
