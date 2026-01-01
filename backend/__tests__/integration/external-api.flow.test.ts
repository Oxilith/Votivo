/**
 * @file backend/__tests__/integration/external-api.flow.test.ts
 * @purpose Integration tests for external API interactions (Claude, Prompt Service)
 * @functionality
 * - Tests successful analysis with mocked Claude API
 * - Tests error handling for Claude API failures
 * - Tests prompt service integration
 * - Tests request validation (missing fields, invalid language, malformed JSON)
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - msw for API mocking (prompt service)
 * - vi.mock for Anthropic SDK mocking (MSW can't intercept undici in Node 22)
 * - @/testing for integration test setup
 */

import request from 'supertest';
import {
  createBackendTestApp,
  createMswServer,
  validAssessmentResponses,
  mockClaudeSuccessResponse,
  http,
  HttpResponse,
} from '@/testing';

// Mock the Anthropic SDK - MSW can't intercept undici fetch in Node.js 22
// See: https://github.com/mswjs/msw/issues/2165
// Use vi.hoisted to ensure the mock is available during module hoisting
const { mockMessagesCreate } = vi.hoisted(() => {
  return { mockMessagesCreate: vi.fn() };
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockMessagesCreate,
      };
    },
  };
});

describe('External API Integration Tests', () => {
  const app = createBackendTestApp();
  const server = createMswServer();

  // MSW server lifecycle - beforeAll/afterAll pair ensures server starts fresh
  // and closes cleanly. Server is NOT shared across test files to prevent
  // handler pollution. Use 'bypass' to allow unmocked requests through.
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    // Default to successful response
    mockMessagesCreate.mockResolvedValue(mockClaudeSuccessResponse);
  });

  afterEach(() => {
    server.resetHandlers();
    mockMessagesCreate.mockReset();
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/v1/claude/analyze', () => {
    it('should return successful analysis with valid request', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis');
      expect(response.body.data.analysis).toHaveProperty('patterns');
      expect(response.body.data.analysis).toHaveProperty('identitySynthesis');
      expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
    });

    it('should support Polish language', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'polish',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept optional user profile', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
          userProfile: {
            name: 'Test User',
            age: 35,
            gender: 'male',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject request with missing responses', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          language: 'english',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      // SDK should not be called for invalid requests
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should reject request with invalid language', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should reject request with incomplete responses', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: {
            peak_energy_times: ['mid_morning'],
            // Missing required fields
          },
          language: 'english',
        });

      expect(response.status).toBe(400);
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should reject request with malformed JSON body', async () => {
      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .set('Content-Type', 'application/json')
        .send('{ invalid json syntax }');

      expect(response.status).toBe(400);
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });
  });

  describe('Claude API error handling', () => {
    it('should handle Claude API 429 rate limit error', async () => {
      // Create error with statusCode property that error middleware checks
      const rateLimitError = new Error('Rate limit exceeded') as Error & { statusCode: number; code: string };
      rateLimitError.name = 'RateLimitError';
      rateLimitError.statusCode = 429;
      rateLimitError.code = 'RATE_LIMIT_EXCEEDED';
      mockMessagesCreate.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
        });

      expect(response.status).toBe(429);
    });

    it('should handle Claude API 500 error', async () => {
      const apiError = new Error('Internal error') as Error & { statusCode: number };
      apiError.name = 'APIError';
      apiError.statusCode = 500;
      mockMessagesCreate.mockRejectedValue(apiError);

      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
        });

      expect(response.status).toBe(500);
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockMessagesCreate.mockRejectedValue(timeoutError);

      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
        });

      // TimeoutError without statusCode is mapped to 500 by error handler
      expect(response.status).toBe(500);
    });
  });

  describe('Prompt Service integration', () => {
    it('should handle prompt service unavailable', async () => {
      server.use(
        http.post('http://localhost:3002/api/resolve', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      const response = await request(app)
        .post('/api/v1/claude/analyze')
        .send({
          responses: validAssessmentResponses,
          language: 'english',
        });

      // Backend has no fallback config - fails with 503 when prompt service unavailable
      expect(response.status).toBe(503);
    });
  });

  describe('Health endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });

    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
    });
  });
});
