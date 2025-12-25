/**
 * @file health/checks/prompt-service.check.ts
 * @purpose Health check for prompt-service microservice connectivity
 * @functionality
 * - Verifies prompt-service is reachable and healthy
 * - Checks the /health endpoint of the prompt service
 * - Returns healthy/unhealthy status based on response
 * - Non-critical check (circuit breaker handles failures with fail-fast)
 * @dependencies
 * - @/config for prompt service URL configuration
 * - @/health/types for HealthCheck, ComponentHealth types
 */

import { config } from '@/config/index.js';
import type { HealthCheck, ComponentHealth } from '../types.js';

const HEALTH_CHECK_TIMEOUT_MS = 5000;

async function checkPromptServiceHealth(): Promise<ComponentHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, HEALTH_CHECK_TIMEOUT_MS);

    const response = await fetch(`${config.promptServiceUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Prompt service is reachable',
      };
    }

    return {
      status: 'unhealthy',
      message: `Prompt service returned HTTP ${response.status}`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Prompt service health check timed out'
          : error.message
        : 'Unknown error connecting to prompt service';

    return {
      status: 'unhealthy',
      message,
    };
  }
}

export function createPromptServiceCheck(): HealthCheck {
  return {
    name: 'prompt-service',
    check: checkPromptServiceHealth,
    critical: false, // Not critical - circuit breaker handles failures
    runOnce: false, // Check on every health request
  };
}
