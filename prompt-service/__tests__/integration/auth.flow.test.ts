/**
 * @file prompt-service/__tests__/integration/auth.flow.test.ts
 * @purpose Integration tests for user authentication flows
 * @functionality
 * - Tests user registration with validation
 * - Tests user login with credentials
 * - Tests token refresh flow
 * - Tests logout with token invalidation
 * - Tests logout all sessions
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - @/testing for integration test setup
 */

import request from 'supertest';
import {
  createIntegrationTestApp,
  extractCsrfToken,
  integrationTestHooks,
  MOCK_PASSWORD,
  prisma,
  registerTestUser,
} from '@/testing';

describe('Auth Flow Integration Tests', () => {
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

  describe('POST /api/user-auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'newuser@example.com',
          password: MOCK_PASSWORD,
          name: 'New User',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.name).toBe('New User');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should set CSRF token cookie on registration', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'csrftest@example.com',
          password: MOCK_PASSWORD,
          name: 'CSRF Test',
          birthYear: 1990,
          gender: 'female',
        });

      expect(response.status).toBe(201);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const hasCsrfToken = cookieArray.some((c: string) =>
        c.startsWith('csrf-token=')
      );
      expect(hasCsrfToken).toBe(true);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'weakpass@example.com',
          password: 'weak', // Too short, no uppercase, no numbers
          name: 'Weak Password',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject password with 7 characters (below minimum)', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'boundary7@example.com',
          password: 'Abc123!', // 7 chars - just below 8 minimum
          name: 'Boundary Test',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(400);
    });

    it('should accept password with exactly 8 characters (boundary)', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'boundary8@example.com',
          password: 'Abcd123!', // 8 chars - exactly at minimum
          name: 'Boundary Test',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(201);
    });

    it('should reject password missing uppercase', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'nouppercase@example.com',
          password: 'password123!', // No uppercase letter
          name: 'No Uppercase',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password missing lowercase', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'nolowercase@example.com',
          password: 'PASSWORD123!', // No lowercase letter
          name: 'No Lowercase',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password missing number', async () => {
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'nonumber@example.com',
          password: 'Password!!!', // No number
          name: 'No Number',
          birthYear: 1990,
          gender: 'male',
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'duplicate@example.com',
          password: MOCK_PASSWORD,
          name: 'First User',
          birthYear: 1990,
          gender: 'male',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/user-auth/register')
        .send({
          email: 'duplicate@example.com',
          password: MOCK_PASSWORD,
          name: 'Second User',
          birthYear: 1991,
          gender: 'female',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/email.*already/i);
    });
  });

  describe('POST /api/user-auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await registerTestUser(app, {
        email: 'logintest@example.com',
        password: MOCK_PASSWORD,
        name: 'Login Test',
      });

      // Login
      const response = await request(app)
        .post('/api/user-auth/login')
        .send({
          email: 'logintest@example.com',
          password: MOCK_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('logintest@example.com');
    });

    it('should reject login with invalid password', async () => {
      await registerTestUser(app, {
        email: 'wrongpass@example.com',
        password: MOCK_PASSWORD,
        name: 'Wrong Pass',
      });

      const response = await request(app)
        .post('/api/user-auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/user-auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: MOCK_PASSWORD,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid/i);
    });
  });

  describe('POST /api/user-auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Use agent to maintain cookies
      const agent = request.agent(app);

      // Register (sets refresh token cookie)
      await agent
        .post('/api/user-auth/register')
        .send({
          email: 'refreshtest@example.com',
          password: MOCK_PASSWORD,
          name: 'Refresh Test',
          birthYear: 1990,
          gender: 'male',
        });

      // Refresh token
      const response = await agent.post('/api/user-auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject refresh without refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/user-auth/refresh');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/user-auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      const agent = request.agent(app);

      // Register
      const registerResponse = await agent
        .post('/api/user-auth/register')
        .send({
          email: 'logouttest@example.com',
          password: MOCK_PASSWORD,
          name: 'Logout Test',
          birthYear: 1990,
          gender: 'male',
        });

      const accessToken = registerResponse.body.accessToken;
      const csrfToken = extractCsrfToken(registerResponse.headers['set-cookie']);

      // Logout with CSRF token
      const logoutResponse = await agent
        .post('/api/user-auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '');

      expect(logoutResponse.status).toBe(200);

      // Try to refresh after logout - should fail
      const refreshResponse = await agent.post('/api/user-auth/refresh');
      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('POST /api/user-auth/logout-all', () => {
    it('should invalidate all refresh tokens for user', async () => {
      const agent = request.agent(app);

      // Register
      const registerResponse = await agent
        .post('/api/user-auth/register')
        .send({
          email: 'logoutall@example.com',
          password: MOCK_PASSWORD,
          name: 'Logout All Test',
          birthYear: 1990,
          gender: 'male',
        });

      const accessToken = registerResponse.body.accessToken;
      const csrfToken = extractCsrfToken(registerResponse.headers['set-cookie']);

      // Logout all sessions
      const logoutResponse = await agent
        .post('/api/user-auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toMatch(/logged out.*session/i);
    });
  });

  describe('POST /api/user-auth/password-reset', () => {
    it('should accept valid email for password reset', async () => {
      // Register a user first
      await registerTestUser(app, {
        email: 'resettest@example.com',
        password: MOCK_PASSWORD,
        name: 'Reset Test',
      });

      // Request password reset
      const response = await request(app)
        .post('/api/user-auth/password-reset')
        .send({ email: 'resettest@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('should return success for non-existent email (prevents enumeration)', async () => {
      // Request password reset for non-existent email
      const response = await request(app)
        .post('/api/user-auth/password-reset')
        .send({ email: 'nonexistent@example.com' });

      // Should still return success to prevent email enumeration attacks
      expect(response.status).toBe(200);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/user-auth/password-reset')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/user-auth/verify-email/:token', () => {
    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .get('/api/user-auth/verify-email/invalid-token-12345');

      // Invalid or expired token returns unauthorized
      expect(response.status).toBe(401);
    });

    it('should reject empty verification token', async () => {
      const response = await request(app)
        .get('/api/user-auth/verify-email/');

      // Route won't match without token, so expect 404
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/user-auth/resend-verification', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user-auth/resend-verification');

      // CSRF middleware runs first and rejects (no CSRF token)
      expect(response.status).toBe(403);
    });

    it('should send verification email for unverified user', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'resendverify@example.com',
        password: MOCK_PASSWORD,
        name: 'Resend Verify Test',
      });
      // Fresh user is unverified by default

      const response = await request(app)
        .post('/api/user-auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/verification email/i);
    });

    it('should return 400 for already verified user', async () => {
      const { accessToken, csrfToken, user } = await registerTestUser(app, {
        email: 'alreadyverified@example.com',
        password: MOCK_PASSWORD,
        name: 'Already Verified User',
      });

      // Manually verify the user in database
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      const response = await request(app)
        .post('/api/user-auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/already verified/i);
    });

    // Note: Rate limiting (429) is tested in rate-limiting.flow.test.ts
    // which has proper setup for real rate limits (vitest.setup.ts disables
    // rate limiting with 10000 req/min for regular tests)
  });
});
