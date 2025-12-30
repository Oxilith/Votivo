/**
 * @file services/__tests__/AuthService.test.ts
 * @purpose Unit tests for AuthService with mocked API client
 * @functionality
 * - Tests authentication methods (login, register, logout)
 * - Tests token refresh flow
 * - Tests user profile operations (getCurrentUser, updateProfile)
 * - Tests password operations (changePassword, requestPasswordReset)
 * - Tests assessment CRUD operations with JSON parsing
 * - Tests analysis CRUD operations with JSON parsing
 * - Tests error handling for corrupted JSON data
 * @dependencies
 * - vitest
 * - @/services/api/AuthService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IApiClient, ApiResponse } from '../interfaces';
import { AuthService } from '../api/AuthService';
import type { AssessmentResponses, AIAnalysisResult } from 'shared';

// Mock useAuthStore
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: 'test-token',
      setAccessToken: vi.fn(),
      clearAuth: vi.fn(),
    }),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    authService = new AuthService(mockClient as unknown as IApiClient);
  });

  describe('authentication', () => {
    it('should login with credentials', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'access-token',
      };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/login',
        { email: 'test@example.com', password: 'password123' },
        { skipAuthRefresh: true }
      );
    });

    it('should register new user', async () => {
      const mockResponse = {
        user: { id: '1', email: 'new@example.com', name: 'New User' },
        accessToken: 'access-token',
      };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'StrongPass1',
        name: 'New User',
        birthYear: 1990,
        gender: 'female',
      });

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/register',
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
        }),
        { skipAuthRefresh: true }
      );
    });

    it('should logout user', async () => {
      mockClient.post.mockResolvedValue({ data: { message: 'Logged out' } });

      await authService.logout();

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/logout',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should logout all sessions', async () => {
      const mockResponse = { message: 'Logged out from all devices' };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.logoutAll();

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/logout-all',
        {},
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should refresh token', async () => {
      const mockResponse = { accessToken: 'new-access-token' };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/refresh',
        {},
        { skipAuthRefresh: true }
      );
    });
  });

  describe('user profile', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockClient.get.mockResolvedValue({ data: mockUser } as ApiResponse<typeof mockUser>);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/user-auth/me',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should update profile', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Updated Name' };
      mockClient.put.mockResolvedValue({ data: mockUser } as ApiResponse<typeof mockUser>);

      const result = await authService.updateProfile({ name: 'Updated Name' });

      expect(result).toEqual(mockUser);
      expect(mockClient.put).toHaveBeenCalledWith(
        '/api/user-auth/profile',
        { name: 'Updated Name' },
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });

    it('should change password', async () => {
      const mockResponse = { message: 'Password changed' };
      mockClient.put.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.changePassword({
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(result).toEqual(mockResponse);
      expect(mockClient.put).toHaveBeenCalledWith(
        '/api/user-auth/password',
        { currentPassword: 'old-password', newPassword: 'new-password' },
        expect.any(Object)
      );
    });

    it('should delete account', async () => {
      const mockResponse = { message: 'Account deleted' };
      mockClient.delete.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.deleteAccount();

      expect(result).toEqual(mockResponse);
      expect(mockClient.delete).toHaveBeenCalledWith(
        '/api/user-auth/account',
        expect.any(Object)
      );
    });
  });

  describe('password reset', () => {
    it('should request password reset', async () => {
      const mockResponse = { message: 'Reset email sent' };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.requestPasswordReset('test@example.com');

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/password-reset',
        { email: 'test@example.com' },
        { skipAuthRefresh: true }
      );
    });

    it('should confirm password reset', async () => {
      const mockResponse = { message: 'Password reset successful' };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.confirmPasswordReset('reset-token', 'NewPass123');

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/password-reset/confirm',
        { token: 'reset-token', newPassword: 'NewPass123' },
        { skipAuthRefresh: true }
      );
    });
  });

  describe('email verification', () => {
    it('should verify email', async () => {
      const mockResponse = {
        message: 'Email verified',
        user: { id: '1', email: 'test@example.com', emailVerified: true },
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.verifyEmail('verification-token');

      expect(result).toEqual(mockResponse);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/user-auth/verify-email/verification-token',
        { skipAuthRefresh: true }
      );
    });

    it('should resend verification email', async () => {
      const mockResponse = { message: 'Verification email sent' };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.resendVerification();

      expect(result).toEqual(mockResponse);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/resend-verification',
        {},
        expect.any(Object)
      );
    });
  });

  describe('assessments', () => {
    const sampleResponses: AssessmentResponses = {
      peak_energy_times: ['mid_morning', 'afternoon'],
      low_energy_times: ['late_night'],
      energy_consistency: 3,
      energy_drains: 'Meetings and interruptions',
      energy_restores: 'Exercise and nature',
      mood_triggers_negative: ['overwhelm', 'lack_of_progress'],
      motivation_reliability: 4,
      willpower_pattern: 'start_stop',
      identity_statements: 'I am a dedicated professional',
      others_describe: 'Hardworking and reliable',
      automatic_behaviors: 'Checking email first thing',
      keystone_behaviors: 'Morning exercise routine',
      core_values: ['growth', 'mastery'],
      natural_strengths: 'Problem solving and focus',
      resistance_patterns: 'Procrastination on creative tasks',
      identity_clarity: 4,
    };

    it('should save assessment and parse response', async () => {
      const mockResponse = {
        id: 'assessment-1',
        userId: 'user-1',
        responses: JSON.stringify(sampleResponses),
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.saveAssessment(sampleResponses);

      expect(result.id).toBe('assessment-1');
      expect(result.responses).toEqual(sampleResponses);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/assessment',
        { responses: sampleResponses },
        expect.any(Object)
      );
    });

    it('should get all assessments and parse responses', async () => {
      const mockResponse = [
        {
          id: 'assessment-1',
          userId: 'user-1',
          responses: JSON.stringify(sampleResponses),
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'assessment-2',
          userId: 'user-1',
          responses: JSON.stringify(sampleResponses),
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.getAssessments();

      expect(result).toHaveLength(2);
      expect(result[0].responses).toEqual(sampleResponses);
      expect(result[1].responses).toEqual(sampleResponses);
    });

    it('should get assessment by ID and parse response', async () => {
      const mockResponse = {
        id: 'assessment-1',
        userId: 'user-1',
        responses: JSON.stringify(sampleResponses),
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.getAssessmentById('assessment-1');

      expect(result.id).toBe('assessment-1');
      expect(result.responses).toEqual(sampleResponses);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/user-auth/assessment/assessment-1',
        expect.any(Object)
      );
    });

    it('should throw error for malformed assessment JSON', async () => {
      const mockResponse = {
        id: 'assessment-1',
        userId: 'user-1',
        responses: 'invalid-json{',
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      await expect(authService.getAssessmentById('assessment-1')).rejects.toThrow(
        'Invalid JSON format (assessment assessment-1)'
      );
    });

    it('should throw error for assessment JSON with invalid schema', async () => {
      const mockResponse = {
        id: 'assessment-1',
        userId: 'user-1',
        responses: JSON.stringify({ invalid: 'schema' }), // Valid JSON but missing required fields
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      await expect(authService.getAssessmentById('assessment-1')).rejects.toThrow(
        'Invalid data structure (assessment assessment-1)'
      );
    });
  });

  describe('analyses', () => {
    const sampleAnalysis: AIAnalysisResult = {
      patterns: [{ title: 'Pattern 1', icon: '📊', severity: 'high', description: 'Test', evidence: [], implication: '', leverage: '' }],
      contradictions: [],
      blindSpots: [],
      leveragePoints: [],
      risks: [],
      identitySynthesis: {
        currentIdentityCore: 'Dedicated professional seeking balance',
        hiddenStrengths: ['Resilience', 'Analytical thinking'],
        keyTension: 'Work demands vs personal wellbeing',
        nextIdentityStep: 'Integrate rest as part of productivity',
      },
    };

    it('should save analysis and parse response', async () => {
      const mockResponse = {
        id: 'analysis-1',
        userId: 'user-1',
        result: JSON.stringify(sampleAnalysis),
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.post.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.saveAnalysis(sampleAnalysis, 'assessment-1');

      expect(result.id).toBe('analysis-1');
      expect(result.result).toEqual(sampleAnalysis);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/user-auth/analysis',
        { result: sampleAnalysis, assessmentId: 'assessment-1' },
        expect.any(Object)
      );
    });

    it('should get all analyses and parse results', async () => {
      const mockResponse = [
        {
          id: 'analysis-1',
          userId: 'user-1',
          result: JSON.stringify(sampleAnalysis),
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.getAnalyses();

      expect(result).toHaveLength(1);
      expect(result[0].result).toEqual(sampleAnalysis);
    });

    it('should get analysis by ID and parse result', async () => {
      const mockResponse = {
        id: 'analysis-1',
        userId: 'user-1',
        result: JSON.stringify(sampleAnalysis),
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      const result = await authService.getAnalysisById('analysis-1');

      expect(result.id).toBe('analysis-1');
      expect(result.result).toEqual(sampleAnalysis);
    });

    it('should throw error for malformed analysis JSON', async () => {
      const mockResponse = {
        id: 'analysis-1',
        userId: 'user-1',
        result: 'not-valid-json',
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      await expect(authService.getAnalysisById('analysis-1')).rejects.toThrow(
        'Invalid JSON format (analysis analysis-1)'
      );
    });

    it('should throw error for analysis JSON with invalid schema', async () => {
      const mockResponse = {
        id: 'analysis-1',
        userId: 'user-1',
        result: JSON.stringify({ patterns: 'not-an-array' }), // Valid JSON but invalid schema
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue({ data: mockResponse } as ApiResponse<typeof mockResponse>);

      await expect(authService.getAnalysisById('analysis-1')).rejects.toThrow(
        'Invalid data structure (analysis analysis-1)'
      );
    });
  });

  describe('authorization header', () => {
    it('should include auth header when token is present', async () => {
      mockClient.get.mockResolvedValue({ data: {} });

      await authService.getCurrentUser();

      expect(mockClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });
  });
});
