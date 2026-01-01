/**
 * @file prompt-service/__tests__/integration/csrf-protection.flow.test.ts
 * @purpose Integration tests for CSRF protection on state-changing endpoints
 * @functionality
 * - Tests CSRF token validation on protected endpoints
 * - Tests rejection of requests without CSRF token
 * - Tests rejection of requests with invalid CSRF token
 * - Tests CSRF token is set on login/register
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - @/testing for integration test setup
 */

import request from 'supertest';
import {
  createIntegrationTestApp,
  integrationTestHooks,
  MOCK_PASSWORD,
  registerTestUser,
} from '@/testing';

describe('CSRF Protection Integration Tests', () => {
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

  describe('Profile update (PUT /api/user-auth/profile)', () => {
    it('should accept request with valid CSRF token', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'csrfvalid@example.com',
        password: MOCK_PASSWORD,
        name: 'CSRF Valid',
      });

      const response = await request(app)
        .put('/api/user-auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should reject request without CSRF token header', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'nocsrfheader@example.com',
        password: MOCK_PASSWORD,
        name: 'No CSRF Header',
      });

      const response = await request(app)
        .put('/api/user-auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Should Fail' });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });

    it('should reject request with mismatched CSRF token', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'csrfmismatch@example.com',
        password: MOCK_PASSWORD,
        name: 'CSRF Mismatch',
      });

      // Send different token in header vs cookie
      const response = await request(app)
        .put('/api/user-auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', 'wrong-token-value')
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({ name: 'Should Fail' });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });
  });

  describe('Password change (PUT /api/user-auth/password)', () => {
    it('should require CSRF token for password change', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'passchange@example.com',
        password: MOCK_PASSWORD,
        name: 'Pass Change',
      });

      const response = await request(app)
        .put('/api/user-auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: MOCK_PASSWORD,
          newPassword: 'NewValidPass456',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });

    it('should allow password change with valid CSRF token', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'passchangevalid@example.com',
        password: MOCK_PASSWORD,
        name: 'Pass Change Valid',
      });

      const response = await request(app)
        .put('/api/user-auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({
          currentPassword: MOCK_PASSWORD,
          newPassword: 'NewValidPass456',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Assessment save (POST /api/user-auth/assessment)', () => {
    it('should require CSRF token for saving assessment', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'assessmentcsrf@example.com',
        password: MOCK_PASSWORD,
        name: 'Assessment CSRF',
      });

      const response = await request(app)
        .post('/api/user-auth/assessment')
        .set('Authorization', `Bearer ${accessToken}`)
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

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });
  });

  describe('Account deletion (DELETE /api/user-auth/account)', () => {
    it('should require CSRF token for account deletion', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'deletecs@example.com',
        password: MOCK_PASSWORD,
        name: 'Delete CSRF',
      });

      const response = await request(app)
        .delete('/api/user-auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: MOCK_PASSWORD });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/csrf/i);
    });

    it('should allow account deletion with valid CSRF token', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'deletevalid@example.com',
        password: MOCK_PASSWORD,
        name: 'Delete Valid',
      });

      const response = await request(app)
        .delete('/api/user-auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({ password: MOCK_PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);
    });
  });
});
