/**
 * @file health/checks/__tests__/anthropic.check.test.ts
 * @purpose Unit tests for Anthropic health check
 * @functionality
 * - Tests healthy response when API is reachable
 * - Tests unhealthy response when API key missing
 * - Tests unhealthy response when API call fails
 * @dependencies
 * - vitest for testing framework
 * - createAnthropicCheck factory under test
 */

// Hoist mock before imports
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

import { createAnthropicCheck } from '@/health';
import { config } from '@/config';

describe('anthropic.check', () => {
  const originalApiKey = config.anthropicApiKey;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to original value from vitest.setup.ts
    (config as { anthropicApiKey: string }).anthropicApiKey = originalApiKey;
  });

  afterEach(() => {
    (config as { anthropicApiKey: string }).anthropicApiKey = originalApiKey;
  });

  describe('createAnthropicCheck', () => {
    it('should return a health check with correct properties', () => {
      const check = createAnthropicCheck();

      expect(check.name).toBe('anthropic');
      expect(check.critical).toBe(true);
      expect(check.runOnce).toBe(true);
      expect(typeof check.check).toBe('function');
    });
  });

  describe('check function', () => {
    it('should return healthy when API is reachable', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'pong' }],
      });

      const check = createAnthropicCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Anthropic API is reachable');
    });

    it('should return unhealthy when API key is missing', async () => {
      (config as { anthropicApiKey: string }).anthropicApiKey = '';

      const check = createAnthropicCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('ANTHROPIC_API_KEY not configured');
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should return unhealthy when API call fails', async () => {
      mockMessagesCreate.mockRejectedValueOnce(new Error('API rate limited'));

      const check = createAnthropicCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('API rate limited');
    });

    it('should handle non-Error exceptions', async () => {
      mockMessagesCreate.mockRejectedValueOnce('network failure');

      const check = createAnthropicCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Unknown error connecting to Anthropic API');
    });

    it('should call API with minimal tokens', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'pong' }],
      });

      const check = createAnthropicCheck();
      await check.check();

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'ping',
            }),
          ]),
        })
      );
    });
  });
});
