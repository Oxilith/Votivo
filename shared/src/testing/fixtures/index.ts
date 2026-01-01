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
 * ## Testing Best Practice: Override What You Assert
 *
 * Fixture factories use faker for realistic random data. To avoid flaky tests:
 * - Always override fields your test assertions depend on
 * - Use random defaults only for fields your test doesn't care about
 *
 * @example
 * ```typescript
 * // ✅ Good - explicit about what matters
 * const user = createMockUser({ email: 'test@example.com' });
 * expect(user.email).toBe('test@example.com');
 *
 * // ❌ Bad - relies on random value
 * const user = createMockUser();
 * expect(user.email).toContain('@'); // Fragile - depends on faker behavior
 * ```
 */

/**
 * Branded type for JSON-stringified fields in database records.
 * Provides compile-time indication of what the JSON string contains.
 * The required brand prevents bidirectional assignment with plain strings.
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
export type JsonString<T> = string & { readonly __jsonType: T };

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
  createMockSavedAssessment,
  createPartialAssessment,
  createPhase1Assessment,
  createPhase2Assessment,
  type MockAssessmentResponsesOptions,
  type MockAssessmentRecordOptions,
  type MockAssessmentRecord,
  type SavedAssessmentApp,
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
  createMockSavedAnalysis,
  createEmptyAnalysisResult,
  type MockAnalysisResultOptions,
  type MockAnalysisRecordOptions,
  type MockAnalysisRecord,
  type MockSavedAnalysisOptions,
  type SavedAnalysisApp,
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
