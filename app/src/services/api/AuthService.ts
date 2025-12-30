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
 * - Handles assessment CRUD (save, list, get by ID)
 * - Handles analysis CRUD (save, list, get by ID)
 * - Automatically injects Authorization header from auth store
 * @dependencies
 * - @/services/interfaces (IAuthService, IApiClient, RequestConfig)
 * - @/types/auth.types for request/response types
 * - shared/index for AssessmentResponses, AIAnalysisResult
 * - @/stores/useAuthStore for access token
 */

import type { IApiClient, RequestConfig } from '@/services/interfaces';
import type { IAuthService } from '@/services/interfaces/IAuthService';
import type {
  SafeUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  RefreshResponse,
  MessageResponse,
  SavedAssessment,
  SavedAssessmentRaw,
  SavedAnalysis,
  SavedAnalysisRaw,
} from '@/types/auth.types';
import type { AssessmentResponses, AIAnalysisResult } from 'shared';
import { apiClient } from './ApiClient';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Safely parse JSON with error handling
 * @param json - JSON string to parse
 * @param context - Context for error message (e.g., "assessment abc123")
 * @returns Parsed object
 * @throws Error with descriptive message if parsing fails
 */
function safeJsonParse<T>(json: string, context: string): T {
  try {
    return JSON.parse(json) as T;
  } catch (parseError) {
    console.error(`Failed to parse ${context}:`, parseError);
    throw new Error(`Data is corrupted (${context})`);
  }
}

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

    // Parse responses from JSON string with error handling
    return {
      ...response.data,
      responses: safeJsonParse<AssessmentResponses>(
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

    // Parse responses from JSON strings with error handling
    return response.data.map((assessment) => ({
      ...assessment,
      responses: safeJsonParse<AssessmentResponses>(
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

    // Parse responses from JSON string with error handling
    return {
      ...response.data,
      responses: safeJsonParse<AssessmentResponses>(
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

    // Parse result from JSON string with error handling
    return {
      ...response.data,
      result: safeJsonParse<AIAnalysisResult>(
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

    // Parse results from JSON strings with error handling
    return response.data.map((analysis) => ({
      ...analysis,
      result: safeJsonParse<AIAnalysisResult>(
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

    // Parse result from JSON string with error handling
    return {
      ...response.data,
      result: safeJsonParse<AIAnalysisResult>(
        response.data.result,
        `analysis ${response.data.id}`
      ),
    };
  }
}

// Default auth service instance using the default API client
export const authService = new AuthService(apiClient);

// Configure token refresh interceptor
// When a 401 error occurs, this handler will be called to refresh the token
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
