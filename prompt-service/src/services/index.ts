/**
 * @file prompt-service/src/services/index.ts
 * @purpose Centralized export for all service modules
 * @functionality
 * - Exports prompt service and types
 * - Exports A/B test service and types
 * - Exports prompt resolver service and types
 * - Exports user service and types
 * - Exports email service and types
 * - Exports audit service and types
 * @dependencies
 * - prompt.service.ts
 * - ab-test.service.ts
 * - prompt-resolver.service.ts
 * - user.service.ts
 * - email.service.ts
 * - audit.service.ts
 */

export {
  PromptService,
  promptService,
  type PromptWithVariants,
  type CreatePromptInput,
  type UpdatePromptInput,
} from './prompt.service';
export {
  ABTestService,
  abTestService,
  type ABTestWithVariants,
  type CreateABTestInput,
  type UpdateABTestInput,
  type CreateABVariantInput,
  type UpdateABVariantInput,
} from './ab-test.service';
export {
  PromptResolverService,
  promptResolverService,
  type ResolveResult,
} from './prompt-resolver.service';
export {
  UserService,
  userService,
  type SafeUser,
  type RegisterInput,
  type LoginInput,
  type ProfileUpdateInput,
  type PasswordChangeInput,
  type SavedAssessment,
  type SavedAnalysis,
  type AuthResult,
  type RefreshResult,
  type RegistrationResult,
} from './user.service';
export {
  EmailService,
  emailService,
  createSmtpConfig,
  type SmtpConfig,
  type EmailResult,
  type PasswordResetEmailInput,
  type EmailVerificationInput,
} from './email.service';
export {
  auditLog,
  type AuditEventType,
  type AuditLogEntry,
  type RequestContext,
} from './audit.service';
