/**
 * @file prompt-service/__tests__/integration/jwt-protection.flow.test.ts
 * @purpose Integration tests for JWT-protected routes
 * @functionality
 * - Tests access to protected routes with valid JWT
 * - Tests rejection of invalid or expired JWTs
 * - Tests rejection of missing authorization header
 * - Tests token format validation
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - @/testing for integration test setup
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import {
  createAuthenticatedRequest,
  createIntegrationTestApp,
  integrationTestHooks,
  MOCK_PASSWORD,
  registerTestUser,
  TEST_CONFIG,
} from '@/testing';

describe('JWT Protection Integration Tests', () => {
  const app = createIntegrationTestApp();

  beforeAll(async () => {
    await integrationTestHooks.setup();
  });

  beforeEach(async () => {
    await integrationTestHooks.cleanup();
  });

  afterAll(async () => {
    await integrationTestHooks.teardown();
  });

  describe('GET /api/user-auth/me', () => {
    it('should return user profile with valid JWT', async () => {
      const { accessToken, user } = await registerTestUser(app, {
        email: 'jwttest@example.com',
        password: MOCK_PASSWORD,
        name: 'JWT Test User',
      });

      const response = await request(app)
        .get('/api/user-auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(user.email);
      expect(response.body.name).toBe(user.name);
    });

    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/user-auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/authorization|token/i);
    });

    it('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/user-auth/me')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid JWT signature', async () => {
      // Create a fake token with invalid signature
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2MDAwMDAwMDB9.invalid_signature';

      const response = await request(app)
        .get('/api/user-auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject request with empty Bearer token', async () => {
      const response = await request(app)
        .get('/api/user-auth/me')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });

    it('should reject request with expired JWT', async () => {
      // Create an expired token using the same secret as the app
      const expiredToken = jwt.sign(
        { userId: 'test-user-id', type: 'access' },
        TEST_CONFIG.jwtAccessSecret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/user-auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired|invalid/i);
    });
  });

  describe('PUT /api/user-auth/profile', () => {
    it('should update profile with valid JWT and CSRF token', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'updateprofile@example.com',
        password: MOCK_PASSWORD,
        name: 'Original Name',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      const response = await authRequest
        .put('/api/user-auth/profile')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should reject profile update without JWT', async () => {
      const response = await request(app)
        .put('/api/user-auth/profile')
        .send({ name: 'New Name' });

      // Middleware order for PUT /profile: csrfMiddleware → jwtAuthMiddleware
      // CSRF middleware runs first and rejects with 403 (missing CSRF token)
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/user-auth/assessment', () => {
    it('should list assessments with valid JWT', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'assessments@example.com',
        password: MOCK_PASSWORD,
        name: 'Assessment User',
      });

      const response = await request(app)
        .get('/api/user-auth/assessment')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject assessment access without JWT', async () => {
      const response = await request(app)
        .get('/api/user-auth/assessment');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user-auth/analyses', () => {
    it('should list analyses with valid JWT', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'analyses@example.com',
        password: MOCK_PASSWORD,
        name: 'Analysis User',
      });

      const response = await request(app)
        .get('/api/user-auth/analyses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Cross-user access prevention', () => {
    it('should not allow accessing another user\'s data', async () => {
      // Create user 1 with an assessment
      const { accessToken: token1, csrfToken: csrf1 } = await registerTestUser(app, {
        email: 'user1@example.com',
        password: MOCK_PASSWORD,
        name: 'User One',
      });

      // Save an assessment for user 1
      const authRequest1 = createAuthenticatedRequest(app, token1, csrf1);
      const assessmentResponse = await authRequest1
        .post('/api/user-auth/assessment')
        .send({
          responses: {
            peak_energy_times: ['mid_morning'],
            low_energy_times: ['evening'],
            energy_consistency: 3,
            energy_drains: 'Meetings',
            energy_restores: 'Sleep',
            mood_triggers_negative: ['overwhelm'],
            motivation_reliability: 4,
            willpower_pattern: 'start_stop',
            identity_statements: 'I am me',
            others_describe: 'Nice',
            automatic_behaviors: 'Checking email',
            keystone_behaviors: 'Exercise',
            core_values: ['growth'],
            natural_strengths: 'Focus',
            resistance_patterns: 'Procrastination',
            identity_clarity: 4,
          },
        });

      expect(assessmentResponse.status).toBe(201);
      const assessmentId = assessmentResponse.body.id;

      // Create user 2
      const { accessToken: token2 } = await registerTestUser(app, {
        email: 'user2@example.com',
        password: MOCK_PASSWORD,
        name: 'User Two',
      });

      // Try to access user 1's assessment with user 2's token
      const response = await request(app)
        .get(`/api/user-auth/assessment/${assessmentId}`)
        .set('Authorization', `Bearer ${token2}`);

      // Ownership filter in database query returns null for wrong user's data.
      // Controller maps null to 404 "not found" - this is intentional as it
      // doesn't leak information about resource existence (preferred over 403).
      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });
  });
});
