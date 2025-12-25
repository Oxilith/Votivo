/**
 * @file prompt-service/src/services/prompt.service.ts
 * @purpose CRUD operations for prompt management with version tracking
 * @functionality
 * - Retrieves all prompts with their variants
 * - Gets individual prompts by ID or key
 * - Creates new prompts with thinking variants
 * - Updates existing prompts and creates version history
 * - Soft deletes prompts by setting isActive to false
 * - Retrieves version history for prompts
 * - Restores prompts to previous versions
 * @dependencies
 * - @/prisma/client for database access
 * - shared/prompt.types for PromptConfig type
 */

import { prisma } from '@/prisma/client.js';
import type { Prompt, PromptVariant, PromptVersion } from '@prisma/client';

export interface PromptWithVariants extends Prompt {
  variants: PromptVariant[];
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

export class PromptService {
  /**
   * Get all active prompts with their variants
   */
  async getAll(): Promise<PromptWithVariants[]> {
    return prisma.prompt.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a prompt by its ID
   */
  async getById(id: string): Promise<PromptWithVariants | null> {
    return prisma.prompt.findUnique({
      where: { id },
      include: { variants: true },
    });
  }

  /**
   * Get a prompt by its key
   */
  async getByKey(key: string): Promise<PromptWithVariants | null> {
    return prisma.prompt.findUnique({
      where: { key },
      include: { variants: true },
    });
  }

  /**
   * Create a new prompt with thinking variants
   */
  async create(input: CreatePromptInput): Promise<PromptWithVariants> {
    const prompt = await prisma.prompt.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        content: input.content,
        model: input.model,
        variants: {
          create: [
            {
              variantType: 'withThinking',
              temperature: input.variants.withThinking.temperature,
              maxTokens: input.variants.withThinking.maxTokens,
              thinkingType: 'enabled',
              budgetTokens: input.variants.withThinking.budgetTokens,
              isDefault: true,
            },
            {
              variantType: 'withoutThinking',
              temperature: input.variants.withoutThinking.temperature,
              maxTokens: input.variants.withoutThinking.maxTokens,
              thinkingType: 'disabled',
              budgetTokens: null,
              isDefault: false,
            },
          ],
        },
        versions: {
          create: {
            version: 1,
            content: input.content,
            model: input.model,
            changeNote: 'Initial version',
          },
        },
      },
      include: { variants: true },
    });

    return prompt;
  }

  /**
   * Update an existing prompt and create a version record
   */
  async update(id: string, input: UpdatePromptInput): Promise<PromptWithVariants> {
    const existingPrompt = await this.getById(id);
    if (!existingPrompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    // Get the latest version number
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    // Determine if content or model changed (requiring a new version)
    const contentChanged = input.content !== undefined && input.content !== existingPrompt.content;
    const modelChanged = input.model !== undefined && input.model !== existingPrompt.model;

    // Update the prompt
    await prisma.prompt.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.model !== undefined && { model: input.model }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        // Create a new version if content or model changed
        ...(contentChanged || modelChanged
          ? {
              versions: {
                create: {
                  version: nextVersion,
                  content: input.content ?? existingPrompt.content,
                  model: input.model ?? existingPrompt.model,
                  ...(input.changedBy !== undefined && { changedBy: input.changedBy }),
                  ...(input.changeNote !== undefined && { changeNote: input.changeNote }),
                },
              },
            }
          : {}),
      },
      include: { variants: true },
    });

    // Update variants if provided
    if (input.variants) {
      if (input.variants.withThinking) {
        const thinkingData: Record<string, number> = {};
        if (input.variants.withThinking.temperature !== undefined) {
          thinkingData['temperature'] = input.variants.withThinking.temperature;
        }
        if (input.variants.withThinking.maxTokens !== undefined) {
          thinkingData['maxTokens'] = input.variants.withThinking.maxTokens;
        }
        if (input.variants.withThinking.budgetTokens !== undefined) {
          thinkingData['budgetTokens'] = input.variants.withThinking.budgetTokens;
        }
        if (Object.keys(thinkingData).length > 0) {
          await prisma.promptVariant.updateMany({
            where: { promptId: id, variantType: 'withThinking' },
            data: thinkingData,
          });
        }
      }
      if (input.variants.withoutThinking) {
        const nonThinkingData: Record<string, number> = {};
        if (input.variants.withoutThinking.temperature !== undefined) {
          nonThinkingData['temperature'] = input.variants.withoutThinking.temperature;
        }
        if (input.variants.withoutThinking.maxTokens !== undefined) {
          nonThinkingData['maxTokens'] = input.variants.withoutThinking.maxTokens;
        }
        if (Object.keys(nonThinkingData).length > 0) {
          await prisma.promptVariant.updateMany({
            where: { promptId: id, variantType: 'withoutThinking' },
            data: nonThinkingData,
          });
        }
      }
    }

    // Return updated prompt with variants
    return this.getById(id) as Promise<PromptWithVariants>;
  }

  /**
   * Soft delete a prompt by setting isActive to false
   */
  async delete(id: string): Promise<void> {
    await prisma.prompt.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get version history for a prompt
   */
  async getVersions(promptId: string): Promise<PromptVersion[]> {
    return prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Restore a prompt to a specific version
   */
  async restoreVersion(
    promptId: string,
    versionId: string,
    changedBy?: string
  ): Promise<PromptWithVariants> {
    const version = await prisma.promptVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.promptId !== promptId) {
      throw new Error(`Version ${versionId} not found for prompt ${promptId}`);
    }

    const updateInput: UpdatePromptInput = {
      content: version.content,
      model: version.model,
      changeNote: `Restored to version ${version.version}`,
    };

    if (changedBy !== undefined) {
      updateInput.changedBy = changedBy;
    }

    return this.update(promptId, updateInput);
  }
}

export const promptService = new PromptService();
