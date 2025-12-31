/**
 * @file shared/src/testing/fixtures/prompt.fixture.ts
 * @purpose Factory functions for creating mock prompt configuration data
 * @functionality
 * - Creates mock Prompt database records
 * - Creates mock PromptVariant records
 * - Creates mock PromptVersion records
 * - Creates mock A/B test related records
 * @dependencies
 * - @faker-js/faker for realistic data generation
 * - @/prompt.types for type definitions
 */

import { faker } from '@faker-js/faker';
import { ClaudeModel } from '@/prompt.types';
import type {
  PromptConfig,
  ThinkingVariant,
  ThinkingConfigParam,
} from '@/prompt.types';

/**
 * Options for creating a mock Prompt record
 */
export interface MockPromptOptions {
  id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  content?: string;
  model?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock Prompt database record
 */
export interface MockPromptRecord {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content: string;
  model: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a mock Prompt database record.
 *
 * @param options - Optional overrides for prompt properties
 * @returns Mock Prompt record
 *
 * @example
 * ```typescript
 * const prompt = createMockPrompt({ key: 'identity-analysis' });
 * ```
 */
export function createMockPrompt(
  options: MockPromptOptions = {}
): MockPromptRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    key: options.key ?? faker.helpers.slugify(faker.lorem.words(3)),
    name: options.name ?? faker.lorem.words(3),
    description: options.description ?? faker.lorem.sentence(),
    content: options.content ?? faker.lorem.paragraphs(2),
    model: options.model ?? ClaudeModel.SONNET_4_0,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Variant type for prompt thinking modes
 */
export type VariantType = 'withThinking' | 'withoutThinking';

/**
 * Thinking type for prompts
 */
export type ThinkingType = 'enabled' | 'disabled';

/**
 * Options for creating a mock PromptVariant record
 */
export interface MockPromptVariantOptions {
  id?: string;
  promptId?: string;
  variantType?: VariantType;
  temperature?: number;
  maxTokens?: number;
  thinkingType?: ThinkingType;
  budgetTokens?: number | null;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock PromptVariant database record
 */
export interface MockPromptVariantRecord {
  id: string;
  promptId: string;
  variantType: string;
  temperature: number;
  maxTokens: number;
  thinkingType: string;
  budgetTokens: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a mock PromptVariant database record.
 *
 * @param options - Optional overrides for variant properties
 * @returns Mock PromptVariant record
 */
export function createMockPromptVariant(
  options: MockPromptVariantOptions = {}
): MockPromptVariantRecord {
  const now = new Date();
  const variantType = options.variantType ?? 'withThinking';

  return {
    id: options.id ?? faker.string.uuid(),
    promptId: options.promptId ?? faker.string.uuid(),
    variantType,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 4096,
    thinkingType:
      options.thinkingType ?? (variantType === 'withThinking' ? 'enabled' : 'disabled'),
    budgetTokens:
      options.budgetTokens ??
      (variantType === 'withThinking' ? 10000 : null),
    isDefault: options.isDefault ?? false,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Options for creating a mock PromptVersion record
 */
export interface MockPromptVersionOptions {
  id?: string;
  promptId?: string;
  version?: number;
  content?: string;
  model?: string;
  changedBy?: string | null;
  changeNote?: string | null;
  createdAt?: Date;
}

/**
 * Mock PromptVersion database record
 */
export interface MockPromptVersionRecord {
  id: string;
  promptId: string;
  version: number;
  content: string;
  model: string;
  changedBy: string | null;
  changeNote: string | null;
  createdAt: Date;
}

/**
 * Creates a mock PromptVersion database record.
 *
 * @param options - Optional overrides for version properties
 * @returns Mock PromptVersion record
 */
export function createMockPromptVersion(
  options: MockPromptVersionOptions = {}
): MockPromptVersionRecord {
  return {
    id: options.id ?? faker.string.uuid(),
    promptId: options.promptId ?? faker.string.uuid(),
    version: options.version ?? 1,
    content: options.content ?? faker.lorem.paragraphs(2),
    model: options.model ?? ClaudeModel.SONNET_4_0,
    changedBy: options.changedBy ?? null,
    changeNote: options.changeNote ?? null,
    createdAt: options.createdAt ?? new Date(),
  };
}

/**
 * Creates a mock PromptConfig object (API response format).
 *
 * @param overrides - Optional overrides for config properties
 * @returns Mock PromptConfig
 *
 * @example
 * ```typescript
 * const config = createMockPromptConfig({
 *   prompt: 'Analyze the following...',
 *   model: ClaudeModel.OPUS_4_5,
 * });
 * ```
 */
export function createMockPromptConfig(
  overrides: Partial<PromptConfig> = {}
): PromptConfig {
  return {
    prompt: overrides.prompt ?? faker.lorem.paragraphs(2),
    model: overrides.model ?? ClaudeModel.SONNET_4_0,
    temperature: overrides.temperature ?? 0.7,
    max_tokens: overrides.max_tokens ?? 4096,
    thinking: overrides.thinking ?? {
      type: 'enabled',
      budget_tokens: 10000,
    },
  };
}

/**
 * Creates a mock ThinkingConfigParam for use in PromptConfig.thinking.
 *
 * @param enabled - Whether thinking is enabled
 * @param budgetTokens - Budget tokens for thinking (only used when enabled)
 * @returns Mock ThinkingConfigParam
 */
export function createMockThinkingConfig(
  enabled = true,
  budgetTokens = 10000
): ThinkingConfigParam {
  if (enabled) {
    return {
      type: 'enabled',
      budget_tokens: budgetTokens,
    };
  }
  return {
    type: 'disabled',
  };
}

/**
 * Options for creating a mock ThinkingVariant
 */
export interface MockThinkingVariantOptions {
  temperature?: number;
  max_tokens?: number;
  thinking?: ThinkingConfigParam;
}

/**
 * Creates a mock ThinkingVariant configuration.
 *
 * @param options - Optional overrides for variant properties
 * @returns Mock ThinkingVariant
 */
export function createMockThinkingVariant(
  options: MockThinkingVariantOptions = {}
): ThinkingVariant {
  return {
    temperature: options.temperature ?? 1.0,
    max_tokens: options.max_tokens ?? 16000,
    thinking: options.thinking ?? createMockThinkingConfig(true, 10000),
  };
}

/**
 * Options for creating a mock ABTest record
 */
export interface MockABTestOptions {
  id?: string;
  promptId?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock ABTest database record
 */
export interface MockABTestRecord {
  id: string;
  promptId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a mock ABTest database record.
 *
 * @param options - Optional overrides for A/B test properties
 * @returns Mock ABTest record
 */
export function createMockABTest(
  options: MockABTestOptions = {}
): MockABTestRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    promptId: options.promptId ?? faker.string.uuid(),
    name: options.name ?? faker.lorem.words(3),
    description: options.description ?? faker.lorem.sentence(),
    isActive: options.isActive ?? false,
    startDate: options.startDate ?? null,
    endDate: options.endDate ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Options for creating a mock ABVariant record
 */
export interface MockABVariantOptions {
  id?: string;
  abTestId?: string;
  name?: string;
  content?: string;
  model?: string;
  weight?: number;
  impressions?: number;
  conversions?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mock ABVariant database record
 */
export interface MockABVariantRecord {
  id: string;
  abTestId: string;
  name: string;
  content: string;
  model: string;
  weight: number;
  impressions: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a mock ABVariant database record.
 *
 * @param options - Optional overrides for variant properties
 * @returns Mock ABVariant record
 */
export function createMockABVariant(
  options: MockABVariantOptions = {}
): MockABVariantRecord {
  const now = new Date();

  return {
    id: options.id ?? faker.string.uuid(),
    abTestId: options.abTestId ?? faker.string.uuid(),
    name: options.name ?? faker.lorem.words(2),
    content: options.content ?? faker.lorem.paragraphs(2),
    model: options.model ?? ClaudeModel.SONNET_4_0,
    weight: options.weight ?? 0.5,
    impressions: options.impressions ?? 0,
    conversions: options.conversions ?? 0,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}
