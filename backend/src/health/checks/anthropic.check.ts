/**
 * @file health/checks/anthropic.check.ts
 * @purpose Health check for Anthropic API connectivity (runs once at startup)
 * @functionality
 * - Makes minimal API call to verify connectivity at startup
 * - Validates API key, network, and service availability
 * - Result is cached after startup to avoid repeated API calls
 * @dependencies
 * - @anthropic-ai/sdk for Claude API
 * - @/config for API key
 * - @/health/types for HealthCheck, ComponentHealth types
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/config';
import type { HealthCheck, ComponentHealth } from '@/health';

const HEALTH_CHECK_MODEL = 'claude-sonnet-4-20250514';

async function checkAnthropicHealth(): Promise<ComponentHealth> {
  if (!config.anthropicApiKey) {
    return {
      status: 'unhealthy',
      message: 'ANTHROPIC_API_KEY not configured',
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    await anthropic.messages.create({
      model: HEALTH_CHECK_MODEL,
      max_tokens: 1,
      messages: [
        {
          role: 'user',
          content: 'ping',
        },
      ],
    });

    return {
      status: 'healthy',
      message: 'Anthropic API is reachable',
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error connecting to Anthropic API';

    return {
      status: 'unhealthy',
      message,
    };
  }
}

export function createAnthropicCheck(): HealthCheck {
  return {
    name: 'anthropic',
    check: checkAnthropicHealth,
    critical: true,
    runOnce: true, // Only run at startup, cache result for subsequent checks
  };
}
