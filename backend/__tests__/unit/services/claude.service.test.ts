/**
 * @file backend/__tests__/unit/services/claude.service.test.ts
 * @purpose Unit tests for Claude service API integration
 * @functionality
 * - Tests successful analysis with valid responses
 * - Tests retry logic with exponential backoff
 * - Tests error handling (empty response, parse failure, API error)
 * - Tests A/B conversion recording
 * - Tests extended thinking configuration
 * @dependencies
 * - vitest for testing framework
 * - analyzeAssessment for service under test
 * - Mock Anthropic SDK
 * - Mock promptClientService
 */

import { analyzeAssessment, promptClientService } from '@/services';
import { createMockPromptConfig, createCompleteAssessment, createMockAnalysisResult } from 'shared/testing';
import type { PromptConfig } from 'shared';

// Mock Anthropic SDK - use vi.hoisted for proper mock hoisting
const { mockMessagesCreate } = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mockMessagesCreate,
    };
  },
}));

// Mock config
vi.mock('@/config', () => ({
  config: {
    anthropicApiKey: 'test-api-key',
    thinkingEnabled: false,
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock promptClientService
vi.mock('@/services/prompt-client.service', () => ({
  promptClientService: {
    resolve: vi.fn(),
    recordConversion: vi.fn(),
  },
}));

// Mock response parser - use actual implementation for integration
vi.mock('@/services/claude/response-parser', async (importOriginal: () => Promise<typeof import('@/services/claude/response-parser')>) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

describe('claude.service', () => {
  // Create config without thinking for base tests - use a plain object to avoid default thinking
  const mockPromptConfig: PromptConfig = {
    prompt: 'Analyze the following assessment:\n',
    model: 'claude-sonnet-4-0',
    max_tokens: 8000,
    temperature: 0.7,
  };

  const mockResponses = createCompleteAssessment();
  const mockAnalysisResult = createMockAnalysisResult();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default successful prompt resolution
    vi.mocked(promptClientService.resolve).mockResolvedValue({
      config: mockPromptConfig,
      variantId: 'variant-123',
    });

    vi.mocked(promptClientService.recordConversion).mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('analyzeAssessment', () => {
    describe('success path', () => {
      it('should return analysis and rawResponse on success', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        const result = await analyzeAssessment(mockResponses, 'english');

        expect(result.analysis).toEqual(mockAnalysisResult);
        expect(result.rawResponse).toBe(rawJson);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
      });

      it('should call promptClientService.resolve with correct params', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(promptClientService.resolve).toHaveBeenCalledWith(
          'IDENTITY_ANALYSIS',
          false // thinkingEnabled from config
        );
      });

      it('should record A/B conversion on success when variantId present', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(promptClientService.recordConversion).toHaveBeenCalledWith('variant-123');
      });

      it('should not fail when conversion recording fails', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        vi.mocked(promptClientService.recordConversion).mockRejectedValueOnce(
          new Error('Conversion failed')
        );

        // Should not throw
        const result = await analyzeAssessment(mockResponses, 'english');
        expect(result.analysis).toEqual(mockAnalysisResult);
      });

      it('should not record conversion when no variantId', async () => {
        vi.mocked(promptClientService.resolve).mockResolvedValueOnce({
          config: mockPromptConfig,
          variantId: undefined,
        });

        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(promptClientService.recordConversion).not.toHaveBeenCalled();
      });

      it('should include userProfile in prompt when provided', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        const userProfile = {
          name: 'John Doe',
          age: 30,
          gender: 'male' as const,
        };

        await analyzeAssessment(mockResponses, 'english', userProfile);

        const callArgs = mockMessagesCreate.mock.calls[0][0] as { messages: { content: string }[] };
        expect(callArgs.messages[0].content).toContain('John Doe');
        expect(callArgs.messages[0].content).toContain('30');
      });
    });

    describe('retry logic', () => {
      it('should retry on empty response', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);

        // First call returns empty, second succeeds
        mockMessagesCreate
          .mockResolvedValueOnce({ content: [] })
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: rawJson }],
          });

        const resultPromise = analyzeAssessment(mockResponses, 'english');

        // Advance past retry delay
        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;
        expect(result.analysis).toEqual(mockAnalysisResult);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
      });

      it('should retry on parse failure with exponential backoff', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);

        // First call returns invalid JSON, second succeeds
        mockMessagesCreate
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: 'invalid json' }],
          })
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: rawJson }],
          });

        const resultPromise = analyzeAssessment(mockResponses, 'english');

        // First retry delay: 1000ms * 1 = 1000ms
        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;
        expect(result.analysis).toEqual(mockAnalysisResult);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
      });

      it('should retry on API error', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);

        mockMessagesCreate
          .mockRejectedValueOnce(new Error('API Error'))
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: rawJson }],
          });

        const resultPromise = analyzeAssessment(mockResponses, 'english');

        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;
        expect(result.analysis).toEqual(mockAnalysisResult);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
      });

      it('should increase retry delay with each attempt', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);

        mockMessagesCreate
          .mockRejectedValueOnce(new Error('Attempt 1 failed'))
          .mockRejectedValueOnce(new Error('Attempt 2 failed'))
          .mockResolvedValueOnce({
            content: [{ type: 'text', text: rawJson }],
          });

        const resultPromise = analyzeAssessment(mockResponses, 'english');

        // First retry: 1000ms * 1 = 1000ms
        await vi.advanceTimersByTimeAsync(1000);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(2);

        // Second retry: 1000ms * 2 = 2000ms
        await vi.advanceTimersByTimeAsync(2000);
        expect(mockMessagesCreate).toHaveBeenCalledTimes(3);

        const result = await resultPromise;
        expect(result.analysis).toEqual(mockAnalysisResult);
      });

      it('should throw after all retries exhausted', async () => {
        mockMessagesCreate.mockImplementation(() => Promise.reject(new Error('Persistent failure')));

        // Catch the error to verify it throws after retries
        let caughtError: Error | undefined;
        const resultPromise = analyzeAssessment(mockResponses, 'english').catch((e: Error) => {
          caughtError = e;
        });

        // Run all timers to completion
        await vi.runAllTimersAsync();
        await resultPromise;

        expect(caughtError?.message).toBe('Persistent failure');
        expect(mockMessagesCreate).toHaveBeenCalledTimes(3);
      });

      it('should throw last error when all retries exhausted with parse failures', async () => {
        mockMessagesCreate.mockImplementation(() =>
          Promise.resolve({
            content: [{ type: 'text', text: 'not json at all' }],
          })
        );

        // Catch the error to verify it throws after retries
        let caughtError: Error | undefined;
        const resultPromise = analyzeAssessment(mockResponses, 'english').catch((e: Error) => {
          caughtError = e;
        });

        // Run all timers to completion
        await vi.runAllTimersAsync();
        await resultPromise;

        expect(caughtError).toBeInstanceOf(Error);
        expect(caughtError?.message).toContain('JSON');
        expect(mockMessagesCreate).toHaveBeenCalledTimes(3);
      });
    });

    describe('request parameters', () => {
      it('should set model from prompt config', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(mockMessagesCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'claude-sonnet-4-0',
          })
        );
      });

      it('should set max_tokens from prompt config', async () => {
        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(mockMessagesCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            max_tokens: 8000,
          })
        );
      });

      it('should set temperature from prompt config when thinking disabled', async () => {
        // Create config without thinking to test temperature passthrough
        const noThinkingConfig: PromptConfig = {
          prompt: 'Analyze:\n',
          model: 'claude-sonnet-4-0',
          max_tokens: 8000,
          temperature: 0.7,
        };

        vi.mocked(promptClientService.resolve).mockResolvedValueOnce({
          config: noThinkingConfig,
          variantId: undefined,
        });

        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(mockMessagesCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature: 0.7,
          })
        );
      });

      it('should use temperature=1 when thinking enabled', async () => {
        const thinkingConfig = createMockPromptConfig({
          prompt: 'Analyze:\n',
          model: 'claude-sonnet-4-0',
          max_tokens: 8000,
          temperature: 0.7,
          thinking: { type: 'enabled', budget_tokens: 10000 },
        });

        vi.mocked(promptClientService.resolve).mockResolvedValueOnce({
          config: thinkingConfig,
          variantId: undefined,
        });

        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(mockMessagesCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature: 1,
            thinking: { type: 'enabled', budget_tokens: 10000 },
          })
        );
      });

      it('should include thinking param when present in config', async () => {
        const thinkingConfig = createMockPromptConfig({
          prompt: 'Analyze:\n',
          model: 'claude-sonnet-4-0',
          max_tokens: 8000,
          temperature: 0.7,
          thinking: { type: 'enabled', budget_tokens: 5000 },
        });

        vi.mocked(promptClientService.resolve).mockResolvedValueOnce({
          config: thinkingConfig,
          variantId: undefined,
        });

        const rawJson = JSON.stringify(mockAnalysisResult);
        mockMessagesCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: rawJson }],
        });

        await analyzeAssessment(mockResponses, 'english');

        expect(mockMessagesCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            thinking: { type: 'enabled', budget_tokens: 5000 },
          })
        );
      });
    });

    describe('error propagation', () => {
      it('should propagate PromptServiceUnavailableError from resolve', async () => {
        const error = new Error('Prompt service unavailable');
        error.name = 'PromptServiceUnavailableError';
        vi.mocked(promptClientService.resolve).mockRejectedValueOnce(error);

        await expect(analyzeAssessment(mockResponses, 'english')).rejects.toThrow(
          'Prompt service unavailable'
        );
        expect(mockMessagesCreate).not.toHaveBeenCalled();
      });
    });
  });
});
