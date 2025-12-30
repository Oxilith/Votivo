/**
 * @file prompt-service/src/admin/api/promptApi.ts
 * @purpose API client for prompt management endpoints
 * @functionality
 * - Fetches all prompts with pagination
 * - Gets individual prompt by ID or key
 * - Creates new prompts with variants
 * - Updates existing prompts
 * - Deletes prompts (soft delete)
 * - Retrieves version history
 * - Restores prompts to previous versions
 * - Uses HttpOnly cookie authentication via credentials: 'include'
 * @dependencies
 * - @/admin/types for type definitions
 * - @/admin/api/auth for authentication utilities and headers
 */

import type {
  PromptDTO,
  PromptVersionDTO,
  CreatePromptInput,
  UpdatePromptInput,
  ApiError,
} from '@/admin';
import { getAuthHeaders, getAuthHeadersNoContent, handleUnauthorized } from './auth';

const API_BASE = '/api/prompts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized - Please login');
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }))) as ApiError;
    throw new Error(error.error);
  }
  return response.json() as Promise<T>;
}

async function handleVoidResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized - Please login');
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }))) as ApiError;
    throw new Error(error.error);
  }
}

export const promptApi = {
  /**
   * Get all prompts
   */
  async getAll(): Promise<PromptDTO[]> {
    const response = await fetch(API_BASE, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<PromptDTO[]>(response);
  },

  /**
   * Get a prompt by ID
   */
  async getById(id: string): Promise<PromptDTO> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<PromptDTO>(response);
  },

  /**
   * Get a prompt by key
   */
  async getByKey(key: string): Promise<PromptDTO> {
    const response = await fetch(`${API_BASE}/key/${key}`, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<PromptDTO>(response);
  },

  /**
   * Create a new prompt
   */
  async create(input: CreatePromptInput): Promise<PromptDTO> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<PromptDTO>(response);
  },

  /**
   * Update an existing prompt
   */
  async update(id: string, input: UpdatePromptInput): Promise<PromptDTO> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<PromptDTO>(response);
  },

  /**
   * Delete a prompt (soft delete)
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleVoidResponse(response);
  },

  /**
   * Get version history for a prompt
   */
  async getVersions(promptId: string): Promise<PromptVersionDTO[]> {
    const response = await fetch(`${API_BASE}/${promptId}/versions`, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<PromptVersionDTO[]>(response);
  },

  /**
   * Restore a prompt to a specific version
   */
  async restoreVersion(
    promptId: string,
    versionId: string,
    changedBy?: string
  ): Promise<PromptDTO> {
    const response = await fetch(
      `${API_BASE}/${promptId}/versions/${versionId}/restore`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ changedBy }),
        credentials: 'include',
      }
    );
    return handleResponse<PromptDTO>(response);
  },
};
