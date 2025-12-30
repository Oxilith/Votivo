/**
 * @file services/claude.service.ts
 * @purpose Secure server-side Claude API integration
 * @functionality
 * - Sends prompts to Claude API using official SDK
 * - Resolves prompt configuration from prompt-service (no local fallback - IP protection)
 * - Includes optional user profile for demographic context in analysis
 * - Implements retry logic with exponential backoff
 * - Supports extended thinking when configured
 * - Records A/B test conversions on successful analysis
 * - Throws PromptServiceUnavailableError when prompt-service is unavailable
 * @dependencies
 * - @anthropic-ai/sdk for Claude API
 * - @/config for API key and feature flags
 * - @/utils/logger for logging
 * - @/services/claude/response-parser for response handling
 * - @/services/prompt-client.service for prompt-service communication (with circuit breaker)
 * - shared for prompt config, response formatter, and UserProfileForAnalysis type
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';
import { config } from '@/config';
import { logger } from '@/utils';
import type { AssessmentResponses, AIAnalysisResult } from '@/types';
import type { AnalysisLanguage, PromptConfig, PromptConfigKey, UserProfileForAnalysis } from 'shared';
import { formatResponsesForPrompt } from 'shared';
import { extractTextFromMessage, parseAnalysisResponse, promptClientService } from '@/services';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRequestParams(
  prompt: string,
  promptConfig: PromptConfig
): MessageCreateParamsNonStreaming {
  const { thinking } = promptConfig;
  const isThinkingEnabled = thinking?.type === 'enabled';

  const params: MessageCreateParamsNonStreaming = {
    model: promptConfig.model,
    max_tokens: promptConfig.max_tokens,
    messages: [{ role: 'user', content: prompt }],
    temperature: isThinkingEnabled ? 1 : promptConfig.temperature,
  };

  if (thinking) {
    params.thinking = thinking;
  }

  return params;
}

interface ResolvedPromptConfig {
  promptConfig: PromptConfig;
  variantId: string | undefined;
}

/**
 * Resolves prompt configuration from prompt-service
 * No local fallback - circuit breaker handles failures with fail-fast behavior
 * @throws PromptServiceUnavailableError when prompt service is unavailable
 */
async function resolvePromptConfig(
  key: PromptConfigKey,
  thinkingEnabled: boolean
): Promise<ResolvedPromptConfig> {
  const resolved = await promptClientService.resolve(key, thinkingEnabled);
  return {
    promptConfig: resolved.config,
    variantId: resolved.variantId,
  };
}

export async function analyzeAssessment(
  responses: AssessmentResponses,
  language: AnalysisLanguage,
  userProfile?: UserProfileForAnalysis
): Promise<{ analysis: AIAnalysisResult; rawResponse: string }> {
  const { promptConfig, variantId } = await resolvePromptConfig(
    'IDENTITY_ANALYSIS',
    config.thinkingEnabled
  );
  const fullPrompt = promptConfig.prompt + formatResponsesForPrompt(responses, language, userProfile);
  const requestParams = buildRequestParams(fullPrompt, promptConfig);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    logger.info(
      {
        attempt,
        maxRetries: MAX_RETRIES,
        model: promptConfig.model,
        thinkingEnabled: requestParams.thinking?.type === 'enabled',
        thinkingBudget: requestParams.thinking?.type === 'enabled' ? requestParams.thinking.budget_tokens : null,
      },
      'Calling Claude API'
    );

    try {
      const message = await anthropic.messages.create(requestParams);
      const rawResponse = extractTextFromMessage(message);

      if (!rawResponse) {
        lastError = new Error('No text content in Claude response');
        logger.warn({ attempt, error: lastError.message }, 'Empty response, retrying');
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      const parseResult = parseAnalysisResponse(rawResponse);
      if (!parseResult.success) {
        lastError = parseResult.error;
        logger.warn({ attempt, error: lastError.message }, 'Failed to parse response, retrying');
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      logger.info('Claude API call successful');

      // Record A/B test conversion on success
      if (variantId) {
        promptClientService.recordConversion(variantId).catch(() => {
          // Error already logged in recordConversion
        });
      }

      return { analysis: parseResult.data, rawResponse };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn({ attempt, error: lastError.message }, 'Claude API call failed, retrying');
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  logger.error({ error: lastError?.message }, 'All Claude API retries exhausted');
  throw lastError ?? new Error('Claude API call failed after all retries');
}
