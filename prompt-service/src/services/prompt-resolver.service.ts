/**
 * @file prompt-service/src/services/prompt-resolver.service.ts
 * @purpose Core prompt resolution with A/B testing integration
 * @functionality
 * - Resolves prompt configurations from database by key
 * - Integrates with A/B testing for variant selection
 * - Applies thinking mode variants based on feature flag
 * - Records impressions for A/B test tracking
 * - Returns PromptConfig compatible with existing backend
 * @dependencies
 * - @/services/prompt.service for prompt retrieval
 * - @/services/ab-test.service for A/B test handling
 * - shared/prompt.types for PromptConfig type
 */

import { promptService, abTestService, type ABTestWithVariants } from '@/services';
import { ClaudeModel, type PromptConfig, type ClaudeModel as ClaudeModelType } from 'shared';
import type { ABVariantConfig } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/errors';

/**
 * Valid ClaudeModel values for runtime validation
 */
const VALID_CLAUDE_MODELS: readonly string[] = Object.values(ClaudeModel);

/**
 * Validates that a model string is a valid ClaudeModel
 * @throws Error if model is not valid
 */
function validateClaudeModel(model: string): ClaudeModelType {
  if (!VALID_CLAUDE_MODELS.includes(model)) {
    throw new ValidationError(
      `Invalid Claude model: "${model}". Valid models are: ${VALID_CLAUDE_MODELS.join(', ')}`
    );
  }
  return model as ClaudeModelType;
}

export interface ResolveResult {
  config: PromptConfig;
  abTestId?: string;
  variantId?: string;
}

export class PromptResolverService {
  /**
   * Resolve a prompt configuration by key with A/B testing support
   */
  async resolve(key: string, thinkingEnabled: boolean): Promise<ResolveResult> {
    // Get the base prompt
    const prompt = await promptService.getByKey(key);
    if (!prompt) {
      throw new NotFoundError('Prompt', key);
    }

    // Check for active A/B test
    const activeTest = await abTestService.getActiveForPrompt(prompt.id);

    if (activeTest && activeTest.variants.length > 0) {
      // Use A/B test variant
      return this.resolveWithABTest(activeTest, thinkingEnabled);
    }

    // Use base prompt configuration
    return this.resolveFromPrompt(prompt, thinkingEnabled);
  }

  /**
   * Resolve configuration from an A/B test
   */
  private async resolveWithABTest(
    test: ABTestWithVariants,
    thinkingEnabled: boolean
  ): Promise<ResolveResult> {
    // Select variant based on weights
    const selectedVariant = abTestService.selectVariant(test.variants);

    // Record impression
    await abTestService.recordImpression(selectedVariant.id);

    // Get the appropriate config based on thinking mode
    const variantConfig = this.selectVariantConfig(
      selectedVariant.configs,
      thinkingEnabled
    );

    const config: PromptConfig = {
      prompt: selectedVariant.content,
      model: validateClaudeModel(selectedVariant.model),
      temperature: variantConfig?.temperature ?? (thinkingEnabled ? 1 : 0.6),
      max_tokens: variantConfig?.maxTokens ?? (thinkingEnabled ? 16000 : 8000),
      ...(thinkingEnabled && variantConfig?.thinkingType === 'enabled'
        ? {
            thinking: {
              type: 'enabled' as const,
              budget_tokens: variantConfig.budgetTokens ?? 8000,
            },
          }
        : thinkingEnabled
          ? {
              thinking: {
                type: 'enabled' as const,
                budget_tokens: 8000,
              },
            }
          : {}),
    };

    return {
      config,
      abTestId: test.id,
      variantId: selectedVariant.id,
    };
  }

  /**
   * Resolve configuration from base prompt
   */
  private resolveFromPrompt(
    prompt: NonNullable<Awaited<ReturnType<typeof promptService.getByKey>>>,
    thinkingEnabled: boolean
  ): ResolveResult {
    const variantType = thinkingEnabled ? 'withThinking' : 'withoutThinking';
    const variant = prompt.variants.find((v) => v.variantType === variantType);

    if (!variant) {
      throw new NotFoundError('Variant', `${variantType} for prompt ${prompt.key}`);
    }

    const config: PromptConfig = {
      prompt: prompt.content,
      model: validateClaudeModel(prompt.model),
      temperature: variant.temperature,
      max_tokens: variant.maxTokens,
      ...(thinkingEnabled && variant.thinkingType === 'enabled'
        ? {
            thinking: {
              type: 'enabled' as const,
              budget_tokens: variant.budgetTokens ?? 8000,
            },
          }
        : {}),
    };

    return { config };
  }

  /**
   * Select the appropriate variant config based on thinking mode
   */
  private selectVariantConfig(
    configs: ABVariantConfig[],
    thinkingEnabled: boolean
  ): ABVariantConfig | undefined {
    const variantType = thinkingEnabled ? 'withThinking' : 'withoutThinking';
    return configs.find((c) => c.variantType === variantType);
  }
}

export const promptResolverService = new PromptResolverService();
