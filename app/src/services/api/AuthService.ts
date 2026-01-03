/**
 * @file services/api/AuthService.ts
 * @purpose HTTP client implementation for user authentication operations
 * @functionality
 * - Implements IAuthService interface for auth API calls
 * - Handles user registration and login
 * - Manages token refresh via httpOnly cookies
 * - Configures automatic 401 handling with token refresh
 * - Handles password reset and email verification flows
 * - Manages user profile operations
 * - Handles assessment CRUD with Zod-validated parsing
 * - Handles analysis CRUD with Zod-validated parsing
 * - Gracefully skips invalid assessment/analysis records when fetching lists
 * - Automatically injects Authorization header from auth store
 * @dependencies
 * - @/services (IAuthService, IApiClient, RequestConfig)
 * - @/types for request/response types
 * - shared for types and Zod validators (parseAssessmentResponses, parseAIAnalysisResult)
 * - @/stores for access token
 * - @/utils for logger
 */

import type { IApiClient, RequestConfig, IAuthService } from '@/services';
import type {
  SafeUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  RefreshResponse,
  RefreshWithUserResponse,
  MessageResponse,
  SavedAssessment,
  SavedAssessmentRaw,
  SavedAnalysis,
  SavedAnalysisRaw,
} from '@/types';
import type { AssessmentResponses, AIAnalysisResult } from '@votive/shared';
import { parseAssessmentResponses, parseAIAnalysisResult } from '@votive/shared';
import { apiClient, ApiClientError, setCsrfTokenGetter } from './ApiClient';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils';


/**
 * Base path for user auth API endpoints
 */
const AUTH_BASE_PATH = '/api/user-auth';

/**
 * Get request config with Authorization header from auth store
 */
function getAuthConfig(): RequestConfig {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * AuthService - handles all authentication and user data operations
 */
export class AuthService implements IAuthService {
  private client: IApiClient;

  constructor(client: IApiClient) {
    this.client = client;
  }

  /**
   * Get request config with Authorization header
   */
  private getAuthConfig(): RequestConfig {
    return getAuthConfig();
  }

  /**
   * Register a new user account
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      `${AUTH_BASE_PATH}/register`,
      data,
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      `${AUTH_BASE_PATH}/login`,
      data,
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Logout current session (clears refresh token cookie)
   */
  async logout(): Promise<void> {
    await this.client.post<MessageResponse>(
      `${AUTH_BASE_PATH}/logout`,
      {},
      this.getAuthConfig()
    );
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(
      `${AUTH_BASE_PATH}/logout-all`,
      {},
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Refresh access token using httpOnly cookie
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await this.client.post<RefreshResponse>(
      `${AUTH_BASE_PATH}/refresh`,
      {},
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Refresh access token and get user data in a single request
   *
   * More efficient than separate refreshToken() + getCurrentUser() calls.
   * Also sets the CSRF token for subsequent requests.
   */
  async refreshTokenWithUser(): Promise<RefreshWithUserResponse> {
    const response = await this.client.post<RefreshWithUserResponse>(
      `${AUTH_BASE_PATH}/refresh-with-user`,
      {},
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(): Promise<SafeUser> {
    const response = await this.client.get<SafeUser>(
      `${AUTH_BASE_PATH}/me`,
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateRequest): Promise<SafeUser> {
    const response = await this.client.put<SafeUser>(
      `${AUTH_BASE_PATH}/profile`,
      data,
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeRequest): Promise<MessageResponse> {
    const response = await this.client.put<MessageResponse>(
      `${AUTH_BASE_PATH}/password`,
      data,
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<MessageResponse> {
    const response = await this.client.delete<MessageResponse>(
      `${AUTH_BASE_PATH}/account`,
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(
      `${AUTH_BASE_PATH}/password-reset`,
      { email },
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(
      `${AUTH_BASE_PATH}/password-reset/confirm`,
      { token, newPassword },
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string; user: SafeUser }> {
    const response = await this.client.get<{ message: string; user: SafeUser }>(
      `${AUTH_BASE_PATH}/verify-email/${token}`,
      { skipAuthRefresh: true }
    );
    return response.data;
  }

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(
      `${AUTH_BASE_PATH}/resend-verification`,
      {},
      this.getAuthConfig()
    );
    return response.data;
  }

  /**
   * Save assessment data for authenticated user
   */
  async saveAssessment(responses: AssessmentResponses): Promise<SavedAssessment> {
    const response = await this.client.post<SavedAssessmentRaw>(
      `${AUTH_BASE_PATH}/assessment`,
      { responses },
      this.getAuthConfig()
    );

    // Parse and validate responses from JSON string
    return {
      ...response.data,
      responses: parseAssessmentResponses(
        response.data.responses,
        `assessment ${response.data.id}`
      ),
    };
  }

  /**
   * Get all assessments for authenticated user
   *
   * Invalid assessments are logged and skipped, not thrown.
   */
  async getAssessments(): Promise<SavedAssessment[]> {
    const response = await this.client.get<SavedAssessmentRaw[]>(
      `${AUTH_BASE_PATH}/assessment`,
      this.getAuthConfig()
    );

    // Parse and validate responses, skipping invalid records
    const validAssessments: SavedAssessment[] = [];
    for (const assessment of response.data) {
      try {
        validAssessments.push({
          ...assessment,
          responses: parseAssessmentResponses(
            assessment.responses,
            `assessment ${assessment.id}`
          ),
        });
      } catch (error) {
        logger.warn('Skipping invalid assessment data', { assessmentId: assessment.id, error });
      }
    }
    return validAssessments;
  }

  /**
   * Get specific assessment by ID for authenticated user
   */
  async getAssessmentById(id: string): Promise<SavedAssessment> {
    const response = await this.client.get<SavedAssessmentRaw>(
      `${AUTH_BASE_PATH}/assessment/${id}`,
      this.getAuthConfig()
    );

    // Parse and validate responses from JSON string
    return {
      ...response.data,
      responses: parseAssessmentResponses(
        response.data.responses,
        `assessment ${response.data.id}`
      ),
    };
  }

  /**
   * Save analysis result for authenticated user
   */
  async saveAnalysis(
    result: AIAnalysisResult,
    assessmentId?: string
  ): Promise<SavedAnalysis> {
    const response = await this.client.post<SavedAnalysisRaw>(
      `${AUTH_BASE_PATH}/analysis`,
      { result, assessmentId },
      this.getAuthConfig()
    );

    // Parse and validate result from JSON string
    return {
      ...response.data,
      result: parseAIAnalysisResult(
        response.data.result,
        `analysis ${response.data.id}`
      ),
    };
  }

  /**
   * Get all analyses for authenticated user
   *
   * Invalid analyses are logged and skipped, not thrown.
   */
  async getAnalyses(): Promise<SavedAnalysis[]> {
    const response = await this.client.get<SavedAnalysisRaw[]>(
      `${AUTH_BASE_PATH}/analyses`,
      this.getAuthConfig()
    );

    // Parse and validate results, skipping invalid records
    const validAnalyses: SavedAnalysis[] = [];
    for (const analysis of response.data) {
      try {
        validAnalyses.push({
          ...analysis,
          result: parseAIAnalysisResult(
            analysis.result,
            `analysis ${analysis.id}`
          ),
        });
      } catch (error) {
        logger.warn('Skipping invalid analysis data', { analysisId: analysis.id, error });
      }
    }
    return validAnalyses;
  }

  /**
   * Get specific analysis by ID for authenticated user
   */
  async getAnalysisById(id: string): Promise<SavedAnalysis> {
    const response = await this.client.get<SavedAnalysisRaw>(
      `${AUTH_BASE_PATH}/analysis/${id}`,
      this.getAuthConfig()
    );

    // Parse and validate result from JSON string
    return {
      ...response.data,
      result: parseAIAnalysisResult(
        response.data.result,
        `analysis ${response.data.id}`
      ),
    };
  }
}

// Default auth service instance using the default API client
export const authService = new AuthService(apiClient);

/**
 * Configure 401 unauthorized handler for automatic token refresh.
 *
 * IMPORTANT: This must be called during application initialization,
 * BEFORE any authenticated API requests are made. The handler is
 * invoked automatically when any API request receives a 401 response.
 *
 * The handler:
 * 1. Attempts to refresh the access token using the refresh token cookie
 * 2. If successful, updates the auth store with the new token and returns it
 * 3. If failed, clears the auth state and returns null
 *
 * The ApiClient uses a Promise singleton pattern to ensure only one
 * refresh request is in flight at a time, even if multiple requests
 * fail with 401 simultaneously.
 */
apiClient.setUnauthorizedHandler(async () => {
  try {
    const response = await authService.refreshToken();
    // Update the auth store with the new access token
    useAuthStore.getState().setAccessToken(response.accessToken);
    return response.accessToken;
  } catch (error) {
    // Clear auth only for actual auth failures (401)
    if (error instanceof ApiClientError && error.status === 401) {
      logger.debug('Token refresh failed with 401, clearing auth');
      useAuthStore.getState().clearAuth();
    } else if (error instanceof ApiClientError && error.status >= 500) {
      // Server errors might be temporary - don't clear auth, let user retry
      logger.warn('Token refresh failed with server error', { error, status: error.status });
    } else if (!(error instanceof ApiClientError)) {
      // Network errors (TypeError, fetch failures) - don't clear auth
      logger.warn('Token refresh failed with network error', { error });
    } else {
      // Other client errors (4xx except 401) - clear auth as these are unrecoverable
      logger.warn('Token refresh failed with client error', { error, status: error.status });
      useAuthStore.getState().clearAuth();
    }
    return null;
  }
});

/**
 * Configure CSRF token getter for the API client.
 *
 * The CSRF token is stored in the auth store after login/register/refresh.
 * The ApiClient reads it from the store to include in request headers.
 */
setCsrfTokenGetter(() => useAuthStore.getState().csrfToken);
