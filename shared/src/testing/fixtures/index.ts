/**
 * @file shared/src/testing/fixtures/index.ts
 * @purpose Barrel export for all fixture factory functions
 * @functionality
 * - Exports user fixtures (createMockUser, createMockSafeUser, etc.)
 * - Exports assessment fixtures (createCompleteAssessment, createMockAssessment, etc.)
 * - Exports analysis fixtures (createMockAnalysisResult, createMockPattern, etc.)
 * - Exports prompt fixtures (createMockPrompt, createMockPromptConfig, etc.)
 * - Exports token fixtures (createMockRefreshToken, createMockPasswordResetToken, etc.)
 * - Exports JsonString branded type for JSON-stringified database fields
 * @dependencies
 * - ./user.fixture
 * - ./assessment.fixture
 * - ./analysis.fixture
 * - ./prompt.fixture
 * - ./token.fixture
 */

/**
 * Branded type for JSON-stringified fields in database records.
 * Provides compile-time indication of what the JSON string contains.
 *
 * @example
 * ```typescript
 * interface Record {
 *   data: JsonString<MyDataType>;
 * }
 *
 * // Parse with type safety
 * const parsed = JSON.parse(record.data) as MyDataType;
 * ```
 */
export type JsonString<T> = string & { readonly __jsonType?: T };

// User fixtures
export {
  createMockUser,
  createMockSafeUser,
  createMockUserInput,
  createMockLoginInput,
  createMockUsers,
  MOCK_PASSWORD,
  MOCK_PASSWORD_HASH,
  type MockUser,
  type MockUserOptions,
  type MockUserInput,
  type MockUserInputOptions,
  type MockLoginInput,
} from './user.fixture';

// Assessment fixtures
export {
  createCompleteAssessment,
  createMockAssessment,
  createPartialAssessment,
  createPhase1Assessment,
  createPhase2Assessment,
  type MockAssessmentResponsesOptions,
  type MockAssessmentRecordOptions,
  type MockAssessmentRecord,
} from './assessment.fixture';

// Analysis fixtures
export {
  createMockPattern,
  createMockContradiction,
  createMockBlindSpot,
  createMockLeveragePoint,
  createMockRisk,
  createMockIdentitySynthesis,
  createMockAnalysisResult,
  createMockAnalysis,
  createEmptyAnalysisResult,
  type MockAnalysisResultOptions,
  type MockAnalysisRecordOptions,
  type MockAnalysisRecord,
} from './analysis.fixture';

// Prompt fixtures
export {
  createMockPrompt,
  createMockPromptVariant,
  createMockPromptVersion,
  createMockPromptConfig,
  createMockThinkingConfig,
  createMockThinkingVariant,
  createMockABTest,
  createMockABVariant,
  type MockPromptOptions,
  type MockPromptRecord,
  type MockPromptVariantOptions,
  type MockPromptVariantRecord,
  type MockPromptVersionOptions,
  type MockPromptVersionRecord,
  type MockThinkingVariantOptions,
  type MockABTestOptions,
  type MockABTestRecord,
  type MockABVariantOptions,
  type MockABVariantRecord,
  type VariantType,
  type ThinkingType,
} from './prompt.fixture';

// Token fixtures
export {
  createMockRefreshToken,
  createExpiredRefreshToken,
  createRevokedRefreshToken,
  createMockPasswordResetToken,
  createExpiredPasswordResetToken,
  createUsedPasswordResetToken,
  createMockEmailVerificationToken,
  createExpiredEmailVerificationToken,
  createUsedEmailVerificationToken,
  createTokenFamily,
  type MockRefreshTokenOptions,
  type MockRefreshTokenRecord,
  type MockPasswordResetTokenOptions,
  type MockPasswordResetTokenRecord,
  type MockEmailVerifyTokenOptions,
  type MockEmailVerifyTokenRecord,
} from './token.fixture';
