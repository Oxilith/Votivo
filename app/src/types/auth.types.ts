/**
 * @file src/types/auth.types.ts
 * @purpose Define TypeScript interfaces for user authentication and profile management
 * @functionality
 * - Re-exports Gender and SafeUserResponse from shared
 * - Defines SafeUser as alias for SafeUserResponse
 * - Defines request/response types for auth API operations
 * - Defines types for assessments and analyses storage
 * @dependencies
 * - shared/index for AIAnalysisResult, AssessmentResponses, Gender, SafeUserResponse
 */

import type { AIAnalysisResult, AssessmentResponses, Gender, SafeUserResponse } from 'shared';

// Re-export shared types for convenience
export type { Gender };

/**
 * User data without sensitive fields (returned from API)
 * Alias for SafeUserResponse from shared
 */
export type SafeUser = SafeUserResponse;

/**
 * Request for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  gender?: Gender;
  birthYear: number;
}

/**
 * Response from successful authentication (login/register)
 */
export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

/**
 * Request for profile update
 */
export interface ProfileUpdateRequest {
  name?: string;
  gender?: Gender;
  birthYear?: number;
}

/**
 * Request for password change
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Saved assessment with metadata
 */
export interface SavedAssessment {
  id: string;
  userId: string;
  responses: AssessmentResponses;
  createdAt: string;
  updatedAt: string;
}

/**
 * Raw assessment from API (responses as JSON string)
 */
export interface SavedAssessmentRaw {
  id: string;
  userId: string;
  responses: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saved analysis with metadata
 */
export interface SavedAnalysis {
  id: string;
  userId: string;
  assessmentId: string | null;
  result: AIAnalysisResult;
  createdAt: string;
}

/**
 * Raw analysis from API (result as JSON string)
 */
export interface SavedAnalysisRaw {
  id: string;
  userId: string;
  assessmentId: string | null;
  result: string;
  createdAt: string;
}

/**
 * Auth error response from API
 */
export interface AuthError {
  error: string;
  code: string;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * Message response from API
 */
export interface MessageResponse {
  message: string;
}
