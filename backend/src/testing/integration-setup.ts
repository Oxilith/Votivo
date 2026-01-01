/**
 * @file backend/src/testing/integration-setup.ts
 * @purpose Integration test infrastructure for backend with MSW mocking
 * @functionality
 * - Creates Express app for integration testing without rate limiting
 * - Sets up MSW server for API mocking
 * - Provides mock handlers for Claude and Prompt Service APIs
 * @dependencies
 * - express for app
 * - msw for API mocking
 * - supertest for HTTP testing
 */

import express, { Router, type Express } from 'express';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { AssessmentResponses } from '@votive/shared';
import { analyze } from '@/controllers';
import healthRoutes from '@/routes/health.routes';
import { tracingMiddleware, notFoundHandler, errorHandler } from '@/middleware';

/**
 * Creates test routes without rate limiting.
 * Mirrors the structure of production routes but excludes rate limiters.
 */
function createTestRoutes(): Router {
  const router = Router();

  // Claude routes without rate limiting
  const claudeRouter = Router();
  claudeRouter.post('/analyze', (req, res, next) => {
    void analyze(req, res, next);
  });

  router.use('/api/v1/claude', claudeRouter);
  router.use('/health', healthRoutes);

  return router;
}

/**
 * Creates a minimal Express app for integration testing.
 * Does NOT include rate limiting, helmet, or compression.
 */
export function createBackendTestApp(): Express {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Tracing
  app.use(tracingMiddleware);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Test routes (without rate limiting)
  app.use(createTestRoutes());

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * Mock Claude API response for successful analysis
 */
export const mockClaudeSuccessResponse = {
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        patterns: [
          {
            title: 'Morning Energy Peak',
            description: 'Consistently highest energy in mornings',
            evidence: ['Peak energy times: morning'],
            category: 'energy',
          },
        ],
        contradictions: [],
        blindSpots: [],
        leveragePoints: [
          {
            title: 'Morning Routine',
            description: 'Leverage natural morning energy',
            strategy: 'Schedule important work in morning',
            expectedImpact: 'Higher productivity',
          },
        ],
        risks: [],
        identitySynthesis: {
          currentIdentity: 'Productive morning person',
          strengths: ['Self-awareness', 'Energy management'],
          growthEdges: ['Afternoon slumps'],
          keyThemes: ['Energy optimization'],
        },
      }),
    },
  ],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 1000,
    output_tokens: 500,
  },
};

/**
 * Mock prompt service response.
 * Must match the expected API response format: { success: true, data: { config: PromptConfig } }
 */
export const mockPromptServiceResponse = {
  success: true,
  data: {
    config: {
      prompt: 'You are an expert behavioral psychologist. Analyze the following assessment: {{responses}}',
      temperature: 0.7,
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
    },
  },
};

/**
 * Creates MSW handlers for external APIs.
 * Note: Anthropic SDK uses undici fetch which MSW can't intercept in Node.js 22.
 * See https://github.com/mswjs/msw/issues/2165
 * Use vi.mock('@anthropic-ai/sdk') instead for Claude API mocking.
 */
export function createMswHandlers() {
  return [
    // Mock Prompt Service (MSW works for native fetch via http module)
    http.post('http://localhost:3002/api/resolve', () => {
      return HttpResponse.json(mockPromptServiceResponse);
    }),
  ];
}

/**
 * Creates an MSW server with default handlers
 */
export function createMswServer() {
  return setupServer(...createMswHandlers());
}

/**
 * Valid assessment responses for testing.
 * Uses exact enum values from shared/validation.ts.
 */
export const validAssessmentResponses: AssessmentResponses = {
  peak_energy_times: ['mid_morning', 'afternoon'],
  low_energy_times: ['evening'],
  energy_consistency: 4,
  energy_drains: 'Back-to-back meetings',
  energy_restores: 'Nature walks and reading',
  mood_triggers_negative: ['overwhelm', 'conflict'],
  motivation_reliability: 3,
  willpower_pattern: 'start_stop',
  identity_statements: 'I am a creative problem solver',
  others_describe: 'Thoughtful and reliable',
  automatic_behaviors: 'Checking phone first thing',
  keystone_behaviors: 'Morning exercise routine',
  core_values: ['growth', 'authenticity', 'connection'],
  natural_strengths: 'Pattern recognition',
  resistance_patterns: 'Perfectionism leading to procrastination',
  identity_clarity: 4,
};

export { http, HttpResponse };
