/**
 * @file services/interfaces/IAuthService.ts
 * @purpose Interface for authentication service operations
 * @functionality
 * - Defines contract for user registration and login
 * - Defines contract for token refresh and logout
 * - Defines contract for password reset flow
 * - Defines contract for email verification
 * - Defines contract for profile management
 * - Defines contract for assessment and analysis data operations
 * @dependencies
 * - @/types for auth-related type definitions
 * - shared/index for AIAnalysisResult
 */

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
  SavedAnalysis,
} from '@/types';
import type { AssessmentResponses, AIAnalysisResult } from 'shared';

/**
 * Interface for authentication service
 */
export interface IAuthService {
  // Authentication
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  logoutAll(): Promise<MessageResponse>;
  refreshToken(): Promise<RefreshResponse>;

  // User profile
  getCurrentUser(): Promise<SafeUser>;
  updateProfile(data: ProfileUpdateRequest): Promise<SafeUser>;
  changePassword(data: PasswordChangeRequest): Promise<MessageResponse>;
  deleteAccount(): Promise<MessageResponse>;

  // Password reset
  requestPasswordReset(email: string): Promise<MessageResponse>;
  confirmPasswordReset(token: string, newPassword: string): Promise<MessageResponse>;

  // Email verification
  verifyEmail(token: string): Promise<{ message: string; user: SafeUser }>;
  resendVerification(): Promise<MessageResponse>;

  // Assessment data
  saveAssessment(responses: AssessmentResponses): Promise<SavedAssessment>;
  getAssessments(): Promise<SavedAssessment[]>;
  getAssessmentById(id: string): Promise<SavedAssessment>;

  // Analysis data
  saveAnalysis(result: AIAnalysisResult, assessmentId?: string): Promise<SavedAnalysis>;
  getAnalyses(): Promise<SavedAnalysis[]>;
  getAnalysisById(id: string): Promise<SavedAnalysis>;
}
