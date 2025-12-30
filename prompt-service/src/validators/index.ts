/**
 * @file prompt-service/src/validators/index.ts
 * @purpose Centralized export for all validation schemas
 * @functionality
 * - Exports prompt validation schemas and types
 * - Exports A/B test validation schemas and types
 * - Exports resolve validation schemas and types
 * - Exports auth validation schemas and types
 * @dependencies
 * - prompt.validator.ts
 * - ab-test.validator.ts
 * - resolve.validator.ts
 * - auth.validator.ts
 */

// Prompt validators
export {
  MAX_PROMPT_CONTENT_LENGTH,
  createPromptSchema,
  updatePromptSchema,
  promptIdParamSchema,
  promptKeyParamSchema,
  versionIdParamSchema,
  type CreatePromptInput,
  type UpdatePromptInput,
} from './prompt.validator';

// A/B test validators
export {
  createABTestSchema,
  updateABTestSchema,
  createABVariantSchema,
  updateABVariantSchema,
  abTestIdParamSchema,
  variantIdParamSchema,
  type CreateABTestInput as CreateABTestValidatorInput,
  type UpdateABTestInput as UpdateABTestValidatorInput,
  type CreateABVariantInput as CreateABVariantValidatorInput,
  type UpdateABVariantInput as UpdateABVariantValidatorInput,
} from './ab-test.validator';

// Resolve validators
export {
  resolvePromptSchema,
  variantIdParamSchema as resolveVariantIdParamSchema,
  type ResolvePromptInput,
} from './resolve.validator';

// Auth validators
export {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  VALID_GENDERS,
  MIN_BIRTH_YEAR,
  MAX_BIRTH_YEAR,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerifyTokenParamSchema,
  resendVerificationSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  type Gender,
  type RegisterInput as RegisterValidatorInput,
  type LoginInput as LoginValidatorInput,
  type PasswordResetRequestInput,
  type PasswordResetConfirmInput,
  type ResendVerificationInput,
  type ProfileUpdateInput as ProfileUpdateValidatorInput,
  type PasswordChangeInput as PasswordChangeValidatorInput,
} from './auth.validator';
