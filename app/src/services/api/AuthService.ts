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
 * - Automatically injects Authorization header from auth store
 * @dependencies
 * - @/services (IAuthService, IApiClient, RequestConfig)
 * - @/types for request/response types
 * - shared for types and Zod validators (parseAssessmentResponses, parseAIAnalysisResult)
 * - @/stores for access token
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
import type { AssessmentResponses, AIAnalysisResult } from 'shared';
import { parseAssessmentResponses, parseAIAnalysisResult } from 'shared';
import { apiClient, setCsrfTokenGetter } from './ApiClient';
import { useAuthStore } from '@/stores';


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
    const response = await this.client.post<AuthResponse, RegisterRequest>(
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
    const response = await this.client.post<AuthResponse, LoginRequest>(
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
    await this.client.post<MessageResponse, Record<string, never>>(
      `${AUTH_BASE_PATH}/logout`,
      {},
      this.getAuthConfig()
    );
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse, Record<string, never>>(
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
    const response = await this.client.post<RefreshResponse, Record<string, never>>(
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
    const response = await this.client.post<RefreshWithUserResponse, Record<string, never>>(
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
    const response = await this.client.put<SafeUser, ProfileUpdateRequest>(
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
    const response = await this.client.put<MessageResponse, PasswordChangeRequest>(
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
    const response = await this.client.post<MessageResponse, { email: string }>(
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
    const response = await this.client.post<
      MessageResponse,
      { token: string; newPassword: string }
    >(
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
    const response = await this.client.post<MessageResponse, Record<string, never>>(
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
    const response = await this.client.post<
      SavedAssessmentRaw,
      { responses: AssessmentResponses }
    >(`${AUTH_BASE_PATH}/assessment`, { responses }, this.getAuthConfig());

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
   */
  async getAssessments(): Promise<SavedAssessment[]> {
    const response = await this.client.get<SavedAssessmentRaw[]>(
      `${AUTH_BASE_PATH}/assessment`,
      this.getAuthConfig()
    );

    // Parse and validate responses from JSON strings
    return response.data.map((assessment) => ({
      ...assessment,
      responses: parseAssessmentResponses(
        assessment.responses,
        `assessment ${assessment.id}`
      ),
    }));
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
    const response = await this.client.post<
      SavedAnalysisRaw,
      { result: AIAnalysisResult; assessmentId?: string }
    >(
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
   */
  async getAnalyses(): Promise<SavedAnalysis[]> {
    const response = await this.client.get<SavedAnalysisRaw[]>(
      `${AUTH_BASE_PATH}/analyses`,
      this.getAuthConfig()
    );

    // Parse and validate results from JSON strings
    return response.data.map((analysis) => ({
      ...analysis,
      result: parseAIAnalysisResult(
        analysis.result,
        `analysis ${analysis.id}`
      ),
    }));
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
  } catch {
    // Refresh failed - clear auth state to force re-login
    useAuthStore.getState().clearAuth();
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
