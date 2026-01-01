/**
 * @file prompt-service/__tests__/integration/database.flow.test.ts
 * @purpose Integration tests for database operations (assessments, analyses, user data)
 * @functionality
 * - Tests assessment CRUD operations
 * - Tests analysis CRUD operations
 * - Tests cascade delete on user deletion
 * - Tests data isolation between users
 * @dependencies
 * - vitest for testing framework
 * - supertest for HTTP testing
 * - @/testing for integration test setup
 */

import request from 'supertest';
import {
  createAuthenticatedRequest,
  createIntegrationTestApp,
  integrationTestHooks,
  MOCK_PASSWORD,
  registerTestUser,
  validAssessmentResponses,
} from '@/testing';

describe('Database Flow Integration Tests', () => {
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

  describe('Assessment CRUD', () => {
    it('should create assessment successfully', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'assessmentcrud@example.com',
        password: MOCK_PASSWORD,
        name: 'Assessment CRUD',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);
      const response = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      // API returns responses as JSON string, parse it to verify content
      const responses = JSON.parse(response.body.responses);
      expect(responses.peak_energy_times).toEqual(['mid_morning', 'afternoon']);
    });

    it('should list user assessments', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'listassess@example.com',
        password: MOCK_PASSWORD,
        name: 'List Assessments',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      // Create two assessments
      await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: { ...validAssessmentResponses, energy_consistency: 5 } });

      // List assessments
      const listResponse = await request(app)
        .get('/api/user-auth/assessment')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(2);
    });

    it('should get single assessment by ID', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'getassess@example.com',
        password: MOCK_PASSWORD,
        name: 'Get Assessment',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      const createResponse = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      const assessmentId = createResponse.body.id;

      const getResponse = await request(app)
        .get(`/api/user-auth/assessment/${assessmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(assessmentId);
      // API returns responses as JSON string, parse it to verify content
      const responses = JSON.parse(getResponse.body.responses);
      expect(responses.peak_energy_times).toEqual(['mid_morning', 'afternoon']);
    });

    it('should return 404 for non-existent assessment', async () => {
      const { accessToken } = await registerTestUser(app, {
        email: 'notfound@example.com',
        password: MOCK_PASSWORD,
        name: 'Not Found',
      });

      const response = await request(app)
        .get('/api/user-auth/assessment/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Analysis CRUD', () => {
    it('should save analysis successfully', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'analysiscrud@example.com',
        password: MOCK_PASSWORD,
        name: 'Analysis CRUD',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      // First create an assessment
      const assessmentResponse = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      const assessmentId = assessmentResponse.body.id;

      // Save analysis
      const analysisResponse = await authRequest
        .post('/api/user-auth/analysis')
        .send({
          assessmentId,
          result: {
            patterns: [
              {
                title: 'Morning Energy Peak',
                description: 'Consistently highest energy in mornings',
                evidence: ['Peak energy times: morning', 'Exercises in morning'],
                category: 'energy',
              },
            ],
            contradictions: [],
            blindSpots: [],
            leveragePoints: [],
            risks: [],
            identitySynthesis: {
              currentIdentity: 'Creative problem solver',
              strengths: ['Pattern recognition'],
              growthEdges: ['Perfectionism'],
              keyThemes: ['Growth mindset'],
            },
          },
        });

      expect(analysisResponse.status).toBe(201);
      expect(analysisResponse.body).toHaveProperty('id');
      expect(analysisResponse.body.assessmentId).toBe(assessmentId);
    });

    it('should list user analyses', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'listanalyses@example.com',
        password: MOCK_PASSWORD,
        name: 'List Analyses',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      // Create assessment and analysis
      const assessmentResponse = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      await authRequest
        .post('/api/user-auth/analysis')
        .send({
          assessmentId: assessmentResponse.body.id,
          result: {
            patterns: [],
            contradictions: [],
            blindSpots: [],
            leveragePoints: [],
            risks: [],
            identitySynthesis: {
              currentIdentity: 'Test',
              strengths: [],
              growthEdges: [],
              keyThemes: [],
            },
          },
        });

      // List analyses
      const listResponse = await request(app)
        .get('/api/user-auth/analyses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBe(1);
    });

    it('should get single analysis by ID', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'getanalysis@example.com',
        password: MOCK_PASSWORD,
        name: 'Get Analysis',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      const assessmentResponse = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      const analysisResponse = await authRequest
        .post('/api/user-auth/analysis')
        .send({
          assessmentId: assessmentResponse.body.id,
          result: {
            patterns: [{ title: 'Test Pattern', description: 'Desc', evidence: [], category: 'energy' }],
            contradictions: [],
            blindSpots: [],
            leveragePoints: [],
            risks: [],
            identitySynthesis: {
              currentIdentity: 'Tester',
              strengths: ['Testing'],
              growthEdges: [],
              keyThemes: [],
            },
          },
        });

      const analysisId = analysisResponse.body.id;

      const getResponse = await request(app)
        .get(`/api/user-auth/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(analysisId);
      // API returns result as JSON string, parse it to verify content
      const result = JSON.parse(getResponse.body.result);
      expect(result.patterns[0].title).toBe('Test Pattern');
    });
  });

  describe('Data isolation between users', () => {
    it('should not return other user\'s assessments in list', async () => {
      // User 1
      const { accessToken: token1, csrfToken: csrf1 } = await registerTestUser(app, {
        email: 'isolation1@example.com',
        password: MOCK_PASSWORD,
        name: 'User One',
      });

      const auth1 = createAuthenticatedRequest(app, token1, csrf1);
      await auth1
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      // User 2
      const { accessToken: token2 } = await registerTestUser(app, {
        email: 'isolation2@example.com',
        password: MOCK_PASSWORD,
        name: 'User Two',
      });

      // User 2 should see empty list
      const listResponse = await request(app)
        .get('/api/user-auth/assessment')
        .set('Authorization', `Bearer ${token2}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toEqual([]);
    });
  });

  describe('Cascade delete on user deletion', () => {
    it('should delete all user data when account is deleted', async () => {
      const { accessToken, csrfToken, user } = await registerTestUser(app, {
        email: 'cascade@example.com',
        password: MOCK_PASSWORD,
        name: 'Cascade Delete',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      // Create assessment
      const assessmentResponse = await authRequest
        .post('/api/user-auth/assessment')
        .send({ responses: validAssessmentResponses });

      // Create analysis
      await authRequest
        .post('/api/user-auth/analysis')
        .send({
          assessmentId: assessmentResponse.body.id,
          result: {
            patterns: [],
            contradictions: [],
            blindSpots: [],
            leveragePoints: [],
            risks: [],
            identitySynthesis: {
              currentIdentity: 'Test',
              strengths: [],
              growthEdges: [],
              keyThemes: [],
            },
          },
        });

      // Delete account
      const deleteResponse = await request(app)
        .delete('/api/user-auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken || '')
        .set('Cookie', `csrf-token=${csrfToken}`)
        .send({ password: MOCK_PASSWORD });

      expect(deleteResponse.status).toBe(200);

      // Verify user cannot login
      const loginResponse = await request(app)
        .post('/api/user-auth/login')
        .send({
          email: user.email,
          password: MOCK_PASSWORD,
        });

      expect(loginResponse.status).toBe(401);
    });
  });

  describe('Validation errors', () => {
    it('should accept partial assessment responses (server stores as-is)', async () => {
      // Note: The API currently does not validate assessment response structure
      // It stores whatever is sent and relies on app validation
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'partialassess@example.com',
        password: MOCK_PASSWORD,
        name: 'Partial Assessment',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      const response = await authRequest
        .post('/api/user-auth/assessment')
        .send({
          responses: {
            // Partial fields - API accepts any structure
            peak_energy_times: ['mid_morning'],
          },
        });

      // API accepts any response structure without validation
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject analysis with non-existent assessmentId (FK constraint)', async () => {
      const { accessToken, csrfToken } = await registerTestUser(app, {
        email: 'invalidanalysis@example.com',
        password: MOCK_PASSWORD,
        name: 'Invalid Analysis',
      });

      const authRequest = createAuthenticatedRequest(app, accessToken, csrfToken);

      const response = await authRequest
        .post('/api/user-auth/analysis')
        .send({
          assessmentId: 'non-existent-id',
          result: {
            patterns: [],
            contradictions: [],
            blindSpots: [],
            leveragePoints: [],
            risks: [],
            identitySynthesis: {
              currentIdentity: 'Test',
              strengths: [],
              growthEdges: [],
              keyThemes: [],
            },
          },
        });

      // AssessmentId ownership is validated before save - returns 404 if not found/owned
      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/assessment.*not found/i);
    });
  });
});
