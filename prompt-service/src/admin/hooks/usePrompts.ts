/**
 * @file prompt-service/src/admin/hooks/usePrompts.ts
 * @purpose React hooks for prompt data fetching and state management
 * @functionality
 * - usePrompts: Fetches all prompts with loading/error states
 * - usePrompt: Fetches single prompt by ID with loading/error states
 * - usePromptVersions: Fetches version history for a prompt
 * - Provides refetch functions for data refresh
 * @dependencies
 * - react for useState, useEffect, useCallback
 * - @/admin/api/promptApi for API calls
 * - @/admin/types for type definitions
 */

import { useState, useEffect, useCallback } from 'react';
import { promptApi } from '@/admin';
import type { PromptDTO, PromptVersionDTO } from '@/admin';

interface UsePromptsResult {
  prompts: PromptDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePrompts(): UsePromptsResult {
  const [prompts, setPrompts] = useState<PromptDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promptApi.getAll();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrompts();
  }, [fetchPrompts]);

  return { prompts, loading, error, refetch: fetchPrompts };
}

interface UsePromptResult {
  prompt: PromptDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePrompt(id: string | undefined): UsePromptResult {
  const [prompt, setPrompt] = useState<PromptDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await promptApi.getById(id);
      setPrompt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompt');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchPrompt();
  }, [fetchPrompt]);

  return { prompt, loading, error, refetch: fetchPrompt };
}

interface UsePromptVersionsResult {
  versions: PromptVersionDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePromptVersions(promptId: string | undefined): UsePromptVersionsResult {
  const [versions, setVersions] = useState<PromptVersionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!promptId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await promptApi.getVersions(promptId);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions };
}
