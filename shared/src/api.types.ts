/**
 * @file shared/src/api.types.ts
 * @purpose Shared API type definitions for app and backend
 * @functionality
 * - Exports AnalysisLanguage type for language selection
 * - Exports SUPPORTED_LANGUAGES const array for validation
 * - Exports UserProfileForAnalysis for demographic context in AI analysis
 * - Ensures consistent language handling across packages
 * @dependencies
 * - ./auth.types for Gender type
 */

import type { Gender } from '@/auth.types';

// Supported languages for AI analysis
export const SUPPORTED_LANGUAGES = ['english', 'polish'] as const;

// Language type derived from const array
export type AnalysisLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * User profile data for analysis personalization (optional)
 * Used to provide demographic context to AI analysis
 */
export interface UserProfileForAnalysis {
  name: string;
  age: number; // Calculated from birthYear
  gender: Gender;
}
