/**
 * @file prompt-service/src/admin/api/abTestApi.ts
 * @purpose API client for A/B test management endpoints
 * @functionality
 * - Fetches all A/B tests
 * - Gets individual A/B test by ID
 * - Creates new A/B tests
 * - Updates existing A/B tests
 * - Deletes A/B tests
 * - Activates and deactivates A/B tests
 * - Manages A/B test variants
 * - Uses HttpOnly cookie authentication via credentials: 'include'
 * @dependencies
 * - @/admin/types for type definitions
 * - @/admin/api/auth for authentication utilities and headers
 */

import type {
  ABTestDTO,
  ABVariantDTO,
  CreateABTestInput,
  UpdateABTestInput,
  CreateABVariantInput,
  UpdateABVariantInput,
  ApiError,
} from '@/admin';
import { getAuthHeaders, getAuthHeadersNoContent, handleUnauthorized } from './auth';

const API_BASE = '/api/ab-tests';

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

export const abTestApi = {
  /**
   * Get all A/B tests
   */
  async getAll(): Promise<ABTestDTO[]> {
    const response = await fetch(API_BASE, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO[]>(response);
  },

  /**
   * Get an A/B test by ID
   */
  async getById(id: string): Promise<ABTestDTO> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO>(response);
  },

  /**
   * Create a new A/B test
   */
  async create(input: CreateABTestInput): Promise<ABTestDTO> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO>(response);
  },

  /**
   * Update an existing A/B test
   */
  async update(id: string, input: UpdateABTestInput): Promise<ABTestDTO> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO>(response);
  },

  /**
   * Delete an A/B test
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
   * Activate an A/B test
   */
  async activate(id: string): Promise<ABTestDTO> {
    const response = await fetch(`${API_BASE}/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO>(response);
  },

  /**
   * Deactivate an A/B test
   */
  async deactivate(id: string): Promise<ABTestDTO> {
    const response = await fetch(`${API_BASE}/${id}/deactivate`, {
      method: 'POST',
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleResponse<ABTestDTO>(response);
  },

  /**
   * Add a variant to an A/B test
   */
  async addVariant(testId: string, input: CreateABVariantInput): Promise<ABVariantDTO> {
    const response = await fetch(`${API_BASE}/${testId}/variants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<ABVariantDTO>(response);
  },

  /**
   * Update a variant
   */
  async updateVariant(
    testId: string,
    variantId: string,
    input: UpdateABVariantInput
  ): Promise<ABVariantDTO> {
    const response = await fetch(`${API_BASE}/${testId}/variants/${variantId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
      credentials: 'include',
    });
    return handleResponse<ABVariantDTO>(response);
  },

  /**
   * Remove a variant from an A/B test
   */
  async removeVariant(testId: string, variantId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${testId}/variants/${variantId}`, {
      method: 'DELETE',
      headers: getAuthHeadersNoContent(),
      credentials: 'include',
    });
    return handleVoidResponse(response);
  },
};
