/**
 * @file prompt-service/src/services/ab-test.service.ts
 * @purpose A/B test management with weighted variant selection and tracking
 * @functionality
 * - Creates and manages A/B tests for prompts
 * - Configures test variants with weights for random selection
 * - Activates and deactivates A/B tests
 * - Records impressions and conversions for analytics
 * - Provides weighted random variant selection
 * @dependencies
 * - @/prisma/client for database access
 */

import {prisma} from '@/prisma';
import type {ABTest, ABVariant, ABVariantConfig} from '@prisma/client';
import {NotFoundError, ValidationError} from '@/errors';

export interface ABTestWithVariants extends ABTest {
  variants: (ABVariant & { configs: ABVariantConfig[] })[];
}

export interface CreateABTestInput {
  promptId: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateABTestInput {
  name?: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
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

export class ABTestService {
  /**
   * Get all A/B tests
   */
  async getAll(): Promise<ABTestWithVariants[]> {
    return prisma.aBTest.findMany({
      include: {
        variants: {
          include: { configs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get A/B test by ID
   */
  async getById(id: string): Promise<ABTestWithVariants | null> {
    return prisma.aBTest.findUnique({
      where: { id },
      include: {
        variants: {
          include: { configs: true },
        },
      },
    });
  }

  /**
   * Get active A/B test for a prompt
   */
  async getActiveForPrompt(promptId: string): Promise<ABTestWithVariants | null> {
    const now = new Date();
    return prisma.aBTest.findFirst({
      where: {
        promptId,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        variants: {
          include: { configs: true },
        },
      },
    });
  }

  /**
   * Create a new A/B test
   */
  async create(input: CreateABTestInput): Promise<ABTestWithVariants> {
    return prisma.aBTest.create({
      data: {
        promptId: input.promptId,
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      include: {
        variants: {
          include: { configs: true },
        },
      },
    });
  }

  /**
   * Update an A/B test
   */
  async update(id: string, input: UpdateABTestInput): Promise<ABTestWithVariants> {
    return prisma.aBTest.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      include: {
        variants: {
          include: { configs: true },
        },
      },
    });
  }

  /**
   * Delete an A/B test
   */
  async delete(id: string): Promise<void> {
    await prisma.aBTest.delete({
      where: { id },
    });
  }

  /**
   * Activate an A/B test (deactivates other tests for the same prompt)
   * Uses transaction to prevent race conditions with concurrent activations
   */
  async activate(id: string): Promise<ABTestWithVariants> {
    const test = await this.getById(id);
    if (!test) {
      throw new NotFoundError('A/B test', id);
    }

    // Use transaction to ensure atomicity - prevents multiple active tests
    return prisma.$transaction(async (tx) => {
      // Deactivate other tests for the same prompt
      await tx.aBTest.updateMany({
        where: {
          promptId: test.promptId,
          id: { not: id },
        },
        data: { isActive: false },
      });

      // Activate this test
      return tx.aBTest.update({
        where: { id },
        data: { isActive: true },
        include: {
          variants: {
            include: { configs: true },
          },
        },
      });
    });
  }

  /**
   * Deactivate an A/B test
   */
  async deactivate(id: string): Promise<ABTestWithVariants> {
    return prisma.aBTest.update({
      where: { id },
      data: { isActive: false },
      include: {
        variants: {
          include: { configs: true },
        },
      },
    });
  }

  /**
   * Add a variant to an A/B test
   */
  async addVariant(testId: string, input: CreateABVariantInput): Promise<ABVariant> {
    const variant = await prisma.aBVariant.create({
      data: {
        abTestId: testId,
        name: input.name,
        content: input.content,
        model: input.model,
        weight: input.weight ?? 0.5,
        configs: input.configs
          ? {
              create: [
                ...(input.configs.withThinking
                  ? [
                      {
                        variantType: 'withThinking',
                        temperature: input.configs.withThinking.temperature,
                        maxTokens: input.configs.withThinking.maxTokens,
                        thinkingType: 'enabled',
                        budgetTokens: input.configs.withThinking.budgetTokens,
                      },
                    ]
                  : []),
                ...(input.configs.withoutThinking
                  ? [
                      {
                        variantType: 'withoutThinking',
                        temperature: input.configs.withoutThinking.temperature,
                        maxTokens: input.configs.withoutThinking.maxTokens,
                        thinkingType: 'disabled',
                        budgetTokens: null,
                      },
                    ]
                  : []),
              ],
            }
          : undefined,
      },
      include: { configs: true },
    });

    // Normalize weights after adding variant
    await this.normalizeWeights(testId);

    return variant;
  }

  /**
   * Update a variant
   */
  async updateVariant(variantId: string, input: UpdateABVariantInput): Promise<ABVariant> {
    const variant = await prisma.aBVariant.update({
      where: { id: variantId },
      data: {
        name: input.name,
        content: input.content,
        model: input.model,
        weight: input.weight,
      },
      include: { configs: true },
    });

    if (input.weight !== undefined) {
      await this.normalizeWeights(variant.abTestId);
    }

    return variant;
  }

  /**
   * Remove a variant from an A/B test
   */
  async removeVariant(variantId: string): Promise<void> {
    const variant = await prisma.aBVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundError('Variant', variantId);
    }

    await prisma.aBVariant.delete({
      where: { id: variantId },
    });

    // Normalize weights after removing variant
    await this.normalizeWeights(variant.abTestId);
  }

  /**
   * Record an impression for a variant
   */
  async recordImpression(variantId: string): Promise<void> {
    await prisma.aBVariant.update({
      where: { id: variantId },
      data: {
        impressions: { increment: 1 },
      },
    });
  }

  /**
   * Record a conversion for a variant
   */
  async recordConversion(variantId: string): Promise<void> {
    await prisma.aBVariant.update({
      where: { id: variantId },
      data: {
        conversions: { increment: 1 },
      },
    });
  }

  /**
   * Select a variant based on weights (weighted random selection)
   */
  selectVariant(
    variants: (ABVariant & { configs: ABVariantConfig[] })[]
  ): ABVariant & { configs: ABVariantConfig[] } {
    if (variants.length === 0) {
      throw new ValidationError('No variants available for selection');
    }

    if (variants.length === 1) {
        return variants[0];
    }

    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to last variant (shouldn't happen with proper weights)
    return variants[variants.length - 1];
  }

  /**
   * Normalize weights to sum to 1.0
   * Uses atomic SQL operations to prevent race conditions with concurrent modifications
   */
  private async normalizeWeights(testId: string): Promise<void> {
    // First, check current state
    const variants = await prisma.aBVariant.findMany({
      where: { abTestId: testId },
      select: { weight: true },
    });

    if (variants.length === 0) return;

    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

    if (totalWeight === 0) {
      // Distribute equally if all weights are 0
      // Use atomic update with computed equal weight
      const equalWeight = 1 / variants.length;
      await prisma.aBVariant.updateMany({
        where: { abTestId: testId },
        data: { weight: equalWeight },
      });
    } else if (Math.abs(totalWeight - 1) > 0.001) {
      // Normalize using atomic raw SQL to prevent race conditions
      // This single statement reads and updates atomically
      // ROUND to 6 decimal places to prevent floating-point precision issues
      await prisma.$executeRaw`
        UPDATE "ABVariant"
        SET "weight" = ROUND("weight" / (
          SELECT COALESCE(SUM("weight"), 1) FROM "ABVariant" WHERE "abTestId" = ${testId}
        ), 6)
        WHERE "abTestId" = ${testId}
      `;
    }
  }
}

export const abTestService = new ABTestService();
