/**
 * @file prompt-service/__tests__/integration/rate-limiting.flow.test.ts
 * @purpose Integration tests for rate limiting functionality
 * @functionality
 * - Tests login rate limiting (2 requests per 100ms window)
 * - Tests register rate limiting (2 requests per 100ms window)
 * - Tests password reset rate limiting (2 requests per 100ms window)
 * - Tests rate limit window reset behavior
 * - Verifies 429 status and error messages when limits exceeded
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - Dynamic imports to reload app with real rate limits
 *
 * NOTE: This test file uses vi.resetModules() to reload the app with real
 * rate limiting enabled. The vitest.setup.ts disables rate limiting (10000 req/min)
 * for regular tests, but these tests need actual limits to verify behavior.
 */

import type { Express } from 'express';
import request from 'supertest';
import { integrationTestHooks, AUTH_ENDPOINTS, MOCK_PASSWORD } from '@/testing';

describe('Rate Limiting Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Set real rate limits with a short window for fast testing
    process.env['RATE_LIMIT_WINDOW_MS'] = '1000'; // 1 second window
    process.env['RATE_LIMIT_LOGIN'] = '2';
    process.env['RATE_LIMIT_REGISTER'] = '2';
    process.env['RATE_LIMIT_PASSWORD_RESET'] = '2';

    // Reset modules to reload config and rate limiters with new values
    vi.resetModules();

    // Dynamically import to get fresh instances with real limits
    const { createIntegrationTestApp } = await import('@/testing');
    app = createIntegrationTestApp();

    await integrationTestHooks.setup();
  });

  beforeEach(async () => {
    await integrationTestHooks.cleanup();
  });

  afterAll(async () => {
    await integrationTestHooks.teardown();

    // Restore high limits for other tests
    process.env['RATE_LIMIT_WINDOW_MS'] = '60000';
    process.env['RATE_LIMIT_LOGIN'] = '10000';
    process.env['RATE_LIMIT_REGISTER'] = '10000';
    process.env['RATE_LIMIT_PASSWORD_RESET'] = '10000';
    vi.resetModules();
  });

  describe('Login Rate Limiting', () => {
    it('should return 429 after exceeding login limit', async () => {
      // Make 2 requests (at the limit)
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post(AUTH_ENDPOINTS.login)
          .send({ email: `test${i}@example.com`, password: MOCK_PASSWORD });
      }

      // 3rd request should be rate limited
      const response = await request(app)
        .post(AUTH_ENDPOINTS.login)
        .send({ email: 'test3@example.com', password: MOCK_PASSWORD });

      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/too many.*login/i);
    });
  });

  describe('Register Rate Limiting', () => {
    it('should return 429 after exceeding register limit', async () => {
      // Make 2 requests (at the limit)
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post(AUTH_ENDPOINTS.register)
          .send({
            email: `ratelimit${i}@example.com`,
            password: MOCK_PASSWORD,
            name: 'Rate Limit Test',
            birthYear: 1990,
            gender: 'male',
          });
      }

      // 3rd request should be rate limited
      const response = await request(app)
        .post(AUTH_ENDPOINTS.register)
        .send({
          email: 'ratelimit3@example.com',
          password: MOCK_PASSWORD,
          name: 'Rate Limit Test',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/too many.*registration/i);
    });
  });

  describe('Password Reset Rate Limiting', () => {
    it('should return 429 after exceeding password reset limit', async () => {
      // Make 2 requests (at the limit)
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post(AUTH_ENDPOINTS.passwordReset)
          .send({ email: `reset${i}@example.com` });
      }

      // 3rd request should be rate limited
      const response = await request(app)
        .post(AUTH_ENDPOINTS.passwordReset)
        .send({ email: 'reset3@example.com' });

      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/too many.*password reset/i);
    });
  });

  describe('Rate Limit Window Reset', () => {
    it('should allow requests after rate limit window expires', async () => {
      // Hit the rate limit
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post(AUTH_ENDPOINTS.login)
          .send({ email: `windowreset${i}@example.com`, password: MOCK_PASSWORD });
      }

      // Verify we're rate limited
      const limitedResponse = await request(app)
        .post(AUTH_ENDPOINTS.login)
        .send({ email: 'limited@example.com', password: MOCK_PASSWORD });
      expect(limitedResponse.status).toBe(429);

      // Wait for window to expire (1s window + 100ms buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next request should succeed (not 429)
      const response = await request(app)
        .post(AUTH_ENDPOINTS.login)
        .send({ email: 'afterreset@example.com', password: MOCK_PASSWORD });

      // Should get auth error (401) not rate limit (429)
      expect(response.status).not.toBe(429);
      expect(response.status).toBe(401); // Invalid credentials expected
    });
  });
});
