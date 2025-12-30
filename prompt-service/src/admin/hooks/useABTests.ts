/**
 * @file prompt-service/src/admin/hooks/useABTests.ts
 * @purpose React hooks for A/B test data fetching and state management
 * @functionality
 * - useABTests: Fetches all A/B tests with loading/error states
 * - useABTest: Fetches single A/B test by ID with loading/error states
 * - Provides refetch functions for data refresh
 * @dependencies
 * - react for useState, useEffect, useCallback
 * - @/admin/api/abTestApi for API calls
 * - @/admin/types for type definitions
 */

import { useState, useEffect, useCallback } from 'react';
import { abTestApi } from '@/admin';
import type { ABTestDTO } from '@/admin';

interface UseABTestsResult {
  abTests: ABTestDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useABTests(): UseABTestsResult {
  const [abTests, setABTests] = useState<ABTestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchABTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await abTestApi.getAll();
      setABTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch A/B tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchABTests();
  }, [fetchABTests]);

  return { abTests, loading, error, refetch: fetchABTests };
}

interface UseABTestResult {
  abTest: ABTestDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useABTest(id: string | undefined): UseABTestResult {
  const [abTest, setABTest] = useState<ABTestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchABTest = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await abTestApi.getById(id);
      setABTest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch A/B test');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchABTest();
  }, [fetchABTest]);

  return { abTest, loading, error, refetch: fetchABTest };
}
