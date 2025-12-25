/**
 * @file prompt-service/src/admin/types.ts
 * @purpose TypeScript type definitions for the Admin UI
 * @functionality
 * - Defines PromptDTO and PromptVariantDTO types
 * - Defines ABTestDTO and ABVariantDTO types
 * - Defines CreatePromptInput and UpdatePromptInput types
 * - Defines CreateABTestInput and UpdateABTestInput types
 * @dependencies None
 */

// Prompt Types
export interface PromptVariantDTO {
  id: string;
  variantType: 'withThinking' | 'withoutThinking';
  temperature: number;
  maxTokens: number;
  thinkingType: 'enabled' | 'disabled';
  budgetTokens: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content: string;
  model: string;
  isActive: boolean;
  variants: PromptVariantDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersionDTO {
  id: string;
  promptId: string;
  version: number;
  content: string;
  model: string;
  changedBy: string | null;
  changeNote: string | null;
  createdAt: string;
}

export interface CreatePromptInput {
  key: string;
  name: string;
  description?: string;
  content: string;
  model: string;
  variants: {
    withThinking: {
      temperature: number;
      maxTokens: number;
      budgetTokens?: number;
    };
    withoutThinking: {
      temperature: number;
      maxTokens: number;
    };
  };
}

export interface UpdatePromptInput {
  name?: string;
  description?: string | null;
  content?: string;
  model?: string;
  isActive?: boolean;
  changedBy?: string;
  changeNote?: string;
  variants?: {
    withThinking?: {
      temperature?: number;
      maxTokens?: number;
      budgetTokens?: number;
    };
    withoutThinking?: {
      temperature?: number;
      maxTokens?: number;
    };
  };
}

// A/B Test Types
export interface ABVariantConfigDTO {
  id: string;
  variantType: 'withThinking' | 'withoutThinking';
  temperature: number;
  maxTokens: number;
  thinkingType: 'enabled' | 'disabled';
  budgetTokens: number | null;
}

export interface ABVariantDTO {
  id: string;
  abTestId: string;
  name: string;
  content: string;
  model: string;
  weight: number;
  impressions: number;
  conversions: number;
  configs: ABVariantConfigDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ABTestDTO {
  id: string;
  promptId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  variants: ABVariantDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateABTestInput {
  promptId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateABTestInput {
  name?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateABVariantInput {
  name: string;
  content: string;
  model: string;
  weight?: number;
  configs?: {
    withThinking?: {
      temperature: number;
      maxTokens: number;
      budgetTokens?: number;
    };
    withoutThinking?: {
      temperature: number;
      maxTokens: number;
    };
  };
}

export interface UpdateABVariantInput {
  name?: string;
  content?: string;
  model?: string;
  weight?: number;
}

// API Response Types
export interface ApiError {
  error: string;
  details?: unknown;
}

// Model Options
export const CLAUDE_MODELS = [
  { value: 'claude-sonnet-4-0', label: 'Claude Sonnet 4.0' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet (Latest)' },
  { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Latest)' },
] as const;
