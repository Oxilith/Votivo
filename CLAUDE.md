# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**See also**: @README.md for user-facing documentation, setup instructions, and feature overview.

## Project Overview

Votive - a full-stack behavioral psychology assessment application with AI-powered analysis.

**Architecture**: Monorepo with five packages:
- `/app` - React 19 frontend (Vite + Zustand + Tailwind v4)
- `/backend` - Express API proxy (protects Anthropic API key)
- `/prompt-service` - Prompt management microservice with admin UI and A/B testing
- `/worker` - Background job scheduler (token cleanup, extensible for future jobs)
- `/shared` - Shared TypeScript types (single source of truth)

## Commands

All commands run from project root via npm workspaces:

```bash
# Quality
npm run lint                     # Lint all projects
npm run type-check               # Type-check all projects
npm run test:run                 # Run all tests (once)
npm run test:coverage            # Run all tests with coverage
npm run verify:conventions       # Verify coding conventions (imports, barrels, etc.)

# Build
npm run build                    # Build all projects (shared first)

# Database (prompt-service)
npm run db:migrate               # Run migrations
npm run db:generate              # Generate Prisma client
npm run db:seed                  # Seed initial data
npm run db:studio                # Open Prisma Studio

# Per-workspace
npm run build -w shared          # Build specific workspace
npm run test -w backend          # Run tests in specific workspace
npm run lint:fix -w app          # Fix lint issues in specific workspace

# Single test file (using Vitest)
npx vitest run path/to/file.test.ts              # Run specific test file
npx vitest run -w backend src/services           # Run tests matching pattern in workspace
npx vitest run --reporter=verbose path/to/file   # Verbose output for debugging
```

## Contribution

- Target `develop` branch (not `main`)
- Branch naming: `feature/short-desc`, `bugfix/issue-123-desc`, `docs/what-changed`
- Commit format: `type(scope): brief description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Security issues: Email konrad.jagusiak@oxilogic.com (not public issues)

## Docker

Development uses Docker exclusively with [dotenvx](https://dotenvx.com) for encrypted environment variables:

```bash
# Local development (build from source)
DOTENV_PRIVATE_KEY=<your-private-key> docker compose up --build

# Production (OCI deployment with pre-built images)
DOTENV_PRIVATE_KEY=<your-private-key> docker compose -f oci://oxilith/votive-oci:latest up

# Set/update environment variables
dotenvx set THINKING_ENABLED true
dotenvx set ANTHROPIC_API_KEY "sk-ant-..."
```

The `.env` file is encrypted and committed - only `.env.keys` (the private key) must stay secret.

See [docs/docker-hub.md](docs/docker-hub.md) for complete workflow documentation.

### HTTPS Certificates (Required for Docker)
```bash
brew install mkcert && mkcert -install
mkdir -p certs && cd certs && mkcert localhost 127.0.0.1 ::1
```

## Code Standards

**Full coding conventions**: See [docs/AI-Agent-Codebase-Instructions.md](docs/AI-Agent-Codebase-Instructions.md) for comprehensive module system, import, and build documentation.

### Environment Files
- **NEVER read or edit `.env` files** - these contain secrets and should not be accessed
- **Exception**: `.env.example` files may be read and edited to document required configuration
- When setting up a new environment, populate `.env.example` with all required variable names and placeholder/example values
- **docker-compose.yml**: Use `${VARIABLE}` syntax for sensitive values so they're injected at runtime, not hardcoded

### TypeScript & Module System
- **No `any` types** - use specific types or `unknown`
- **Path aliases** - always use `@/` imports, never relative paths
- **Shared types** - import from `shared` package directly (e.g., `import { ... } from 'shared'`)
- **Barrel exports** - import from directories via `index.ts`, not individual files
- **No `.js` extensions** - uses `moduleResolution: "Bundler"`, not NodeNext
- **Strict mode** - `noUnusedLocals`, `noUnusedParameters` enforced
- Use `React.ComponentRef` (not deprecated `React.ElementRef`)
- **Anthropic SDK types** - use `ThinkingConfigParam` from `@anthropic-ai/sdk/resources/messages`

```typescript
// ✅ Correct imports
import { config } from '@/config';
import { ClaudeService } from '@/services';
import { ApiResponse } from 'shared';

// ❌ Wrong imports
import { config } from '../config/index.js';
import { ClaudeService } from '@/services/claude.service';
import { ApiResponse } from 'shared/index.js';
```

### Build System

| Package | Build Tool | Command | Output |
|---------|-----------|---------|--------|
| shared | tsup | `npm run build -w shared` | `shared/dist/` |
| backend | tsup | `npm run build -w backend` | `backend/dist/` |
| worker | tsup | `npm run build -w worker` | `worker/dist/` |
| prompt-service | tsup + vite | `npm run build -w prompt-service` | `prompt-service/dist/` |
| app | tsc + vite | `npm run build -w app` | `app/dist/` |

**Build order**: `shared` must build first - other packages depend on it.

### Documentation Headers
Every component/service requires JSDoc header:
```typescript
/**
 * @file src/path/to/file.ts
 * @purpose Single sentence describing business value (max 25 words)
 * @functionality
 * - Feature bullet 1
 * - Feature bullet 2
 * @dependencies
 * - React hooks, custom components, external libraries
 */
```

### Quality Gates
- All changes must pass `npm run lint` and `npm run type-check` with zero warnings/errors
- Documentation must be updated when code changes

## Architecture

### Shared Package (`/shared/src`)

Single source of truth for types, validation, and utilities used by frontend, backend, and prompt-service:
- `assessment.types.ts` - Core domain types (TimeOfDay, MoodTrigger, CoreValue, WillpowerPattern, AssessmentResponses)
- `analysis.types.ts` - AI analysis result types (AnalysisPattern, AnalysisContradiction, AnalysisBlindSpot, AnalysisLeveragePoint, AnalysisRisk, IdentitySynthesis, AIAnalysisResult)
- `api.types.ts` - API types (AnalysisLanguage, UserProfileForAnalysis, SUPPORTED_LANGUAGES)
- `auth.types.ts` - Auth types (Gender, SafeUserResponse)
- `labels.ts` - Human-readable label mappings for enum values
- `validation.ts` - Enum value arrays for Zod schemas, REQUIRED_FIELDS, PASSWORD_REGEX, field categorization
- `responseFormatter.ts` - Shared `formatResponsesForPrompt()` function for AI analysis
- `prompt.types.ts` - Prompt config types (ClaudeModel, PromptConfig, ThinkingVariant, PromptConfigDefinition)
- `tracing.ts` - W3C Trace Context utilities (OpenTelemetry compatible)
- `index.ts` - Barrel exports

Import via `shared` in packages (e.g., `import { ... } from 'shared'`).

### Prompt Service (`/prompt-service`)

Microservice for prompt management with database storage and admin UI:
- `src/services/prompt.service.ts` - CRUD operations for prompts with input validation
- `src/services/ab-test.service.ts` - A/B test management with atomic weight normalization
- `src/services/prompt-resolver.service.ts` - Resolves prompt config based on key and thinking mode
- `src/errors/index.ts` - Type-safe error hierarchy (AppError, NotFoundError, ValidationError, ConflictError)
- `src/utils/sanitize.ts` - Input validation for XSS prevention (script tags, event handlers, javascript: URLs)
- `src/constants/auth.ts` - Authentication constants (cookie name, session values, header names)
- `src/routes/auth.routes.ts` - Authentication endpoints (login, logout, verify) with HttpOnly cookies
- `src/routes/` - REST API endpoints for prompts, A/B tests, and resolve
- `src/admin/` - React admin UI for prompt and A/B test management
- `prisma/schema.prisma` - SQLite database schema (encrypted with libsql)

The backend calls the prompt-service `/api/resolve` endpoint to get prompt configurations.

**User Authentication** (`/prompt-service/src/services/user.service.ts`):
- JWT-based authentication with access/refresh token rotation
- Password hashing with bcrypt and timing-safe comparisons
- Email verification and password reset flows
- Rate limiting per endpoint (login: 5/min, register: 5/min, password reset: 3/min)
- Email rate limiting (5 verification emails per hour per user)

**Security Middleware**:
- `src/middleware/rate-limit.middleware.ts` - Factory pattern for per-route rate limiters with env-configurable limits
- `src/middleware/csrf.middleware.ts` - CSRF protection using double-submit cookie pattern
- `src/middleware/tracing.middleware.ts` - W3C Trace Context (OpenTelemetry compatible)

**CSRF Protection** (`/prompt-service/src/middleware/csrf.middleware.ts`):
- Double-submit cookie pattern for state-changing requests
- Token validation with timing-safe comparison
- Applied to: logout, profile update, password change, account deletion, save assessment/analysis
- Token set on login/register, cleared on logout

**Password Validation**:
- Minimum 8 characters
- Requires: uppercase, lowercase, and number
- Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`

### Worker (`/worker`)

Background job scheduler for maintenance tasks:
- `src/scheduler/index.ts` - Generic job scheduler using node-cron with W3C trace context
- `src/jobs/token-cleanup.job.ts` - Cleans expired refresh, password reset, and email verification tokens
- `src/config/index.ts` - Environment-configurable job schedules
- Shares database with prompt-service via libsql

**Worker Configuration**:
- `JOB_TOKEN_CLEANUP_ENABLED` - Enable/disable token cleanup (default: true)
- `JOB_TOKEN_CLEANUP_SCHEDULE` - Cron schedule (default: `0 * * * *` = hourly)

### Distributed Tracing (`/shared/src/tracing.ts`)

W3C Trace Context implementation (OpenTelemetry compatible):
- `generateTraceId()` / `generateSpanId()` - Cryptographic ID generation
- `createTraceparent()` / `parseTraceparent()` - Header serialization
- `extractOrCreateTrace()` - Extract from headers or create new trace
- Applied in: backend, prompt-service, worker (via tracing middleware)

### Frontend (`/app/src`)

**State Management** - Zustand stores (not Redux):
- `stores/useAuthStore.ts` - Auth state (user, tokens, CSRF token) with token refresh
- `stores/useAssessmentStore.ts` - Assessment responses with localStorage persistence
- `stores/useUIStore.ts` - View state, navigation, loading/error
- `stores/useAnalysisStore.ts` - AI analysis results

**Service Layer**:
- `services/api/ApiClient.ts` - HTTP client with retry logic, timeout handling
- `services/api/ClaudeService.ts` - Backend API calls for analysis
- `services/api/AuthService.ts` - Authentication API calls (login, register, refresh, etc.)
- `services/interfaces/` - TypeScript interfaces for dependency injection

**Key Directories**:
- `components/assessment/` - Multi-phase questionnaire wizard (split into steps/, hooks/, navigation/)
- `components/auth/` - Login, register, email verification, password reset flows
- `components/insights/` - AI analysis display
- `components/landing/` - Homepage (hero, philosophy, journey, CTA sections)
- `components/profile/` - User profile, password, assessments, analyses management
- `components/shared/` - Header, theme toggle, navigation
- `styles/theme.ts` - Shared Tailwind utilities (cardStyles, textStyles)
- `i18n/resources/` - Translations (en/, pl/)
- `config/` - Application configuration

**i18n Structure** - Translations are split by feature area:
- `i18n/resources/{lang}/landing.json` - Landing page sections (nav, hero, philosophy, journey, insights, cta, footer)
- `i18n/resources/{lang}/header.json` - Navigation/header (nav, buttons, viewOnly, errors, theme)
- `i18n/resources/{lang}/assessment.json` - Assessment wizard (welcome, phases, synthesis, navigation)
- `i18n/resources/{lang}/insights.json` - AI analysis display (noAssessment, ready, loading, error, tabs, cards, synthesis)
- `i18n/resources/{lang}/auth.json` - Authentication (login, register, forgotPassword, resetPassword, verifyEmail)
- `i18n/resources/{lang}/profile.json` - Profile/settings (tabs, profileTab, passwordTab, assessmentsTab, analysesTab, dangerTab)
- `i18n/resources/{lang}/common.json` - Shared UI strings (progress, createdAt, viewOnly)

**i18n Rules**:
- Add translations to the feature-specific file, not common.json
- Specify namespaces in `useTranslation`: `useTranslation('landing')` or `useTranslation(['assessment', 'header'])`
- Single namespace: `t('key.path')` - no namespace prefix needed
- Multiple namespaces: `t('key.path')` for first namespace, `t('ns:key.path')` for secondary namespaces
- Keep common.json minimal (only truly shared strings across multiple features)
- Mirror structure exactly in both en/ and pl/ directories

### Backend (`/backend/src`)

**API Proxy** - Protects Anthropic API key from browser exposure:
- `services/claude.service.ts` - Claude API integration with retry logic
- `services/prompt-client.service.ts` - Client for prompt-service with circuit breaker, caching, and concurrent refresh limiting (max 3)
- `services/prompt-cache.service.ts` - In-memory cache for prompt configurations (uses JSON serialization for cache keys)
- `services/circuit-breaker.service.ts` - Generic circuit breaker wrapper with cleanup functions (`destroyAllCircuitBreakers()` for graceful shutdown)
- `controllers/claude.controller.ts` - Request handler for analysis endpoint
- `routes/api/v1/` - API route definitions (`/api/v1/claude/analyze`)
- `validators/claude.validator.ts` - Zod request validation using enum arrays from shared
- `types/claude.types.ts` - Re-exports shared types, defines API request/response types
- `middleware/` - CORS, rate limiting, error handling, helmet
- `config/index.ts` - Zod-validated environment configuration
- `health/checks/prompt-service.check.ts` - Health check for prompt-service dependency
- `utils/logger.ts` - Pino structured logging

### Data Flow
```
Frontend (Zustand) → ApiClient → Backend (Express) → Claude API
                    ↓               ↓          ↓
              localStorage     Prompt-Service  Pino logs
                                    ↓
                              SQLite (encrypted)
                                    ↑
                              Worker (cron jobs)
```

## Environment Variables

See [docs/production-deployment.md](docs/production-deployment.md#environment-variables) for complete reference.

Key variables:
- `VITE_API_URL` - Frontend build-time (leave empty for Docker)
- `ANTHROPIC_API_KEY` - Claude API key
- `DATABASE_KEY` / `ADMIN_API_KEY` / `SESSION_SECRET` - 32+ char secrets for prompt-service
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` - 32+ char secrets for user authentication tokens
- `THINKING_ENABLED` - Backend flag for Claude extended thinking mode (default: true)
- `SMTP_*` - Optional SMTP configuration for email verification/password reset

## Testing

Coverage thresholds vary by package:

| Package | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| app | 75% | 75% | 75% | 75% |
| backend | 85% | 85% | 80% | 85% |
| prompt-service | 75% | 75% | 65% | 75% |
| shared | 80% | 70% | 10% | 80% |
| worker | 85% | 85% | 85% | 85% |

- Frontend: React Testing Library + MSW for mocking
- Backend: Supertest for API tests
- Test files: `**/__tests__/*.test.ts` or `**/*.test.tsx`

Sample test personas in `/personas/` for quick testing.

## Domain Framework

5-phase psychological model (see `/docs/Motivation.md`):
1. **State Awareness** - Energy, mood, motivation patterns
2. **Identity Mapping** - Current self through behaviors/values
3. **Identity Design** - Aspirational identity with stepping-stones
4. **System Implementation** - Habit loops, environment design
5. **Feedback & Integration** - Progress tracking

**AI Analysis Output** (`AIAnalysisResult` type): `patterns`, `contradictions`, `blindSpots`, `leveragePoints`, `risks`, `identitySynthesis`

## Docker Architecture

```
Browser → nginx (HTTPS :443) → backend (HTTP :3001)
                ↑
         SSL termination (API requests: /api/* → backend:3001)
```

- Multi-arch images: `linux/amd64` + `linux/arm64`
- npm workspaces with shared package via symlinks
- Backend uses non-root user for security
- `tsconfig.base.json` required in Docker context for builds

### Design System

**Ink & Stone Design System**: See [docs/votive-ink-design-system.md](docs/votive-ink-design-system.md) for the complete visual language including:
- Japanese minimalism aesthetic (wabi-sabi, ma)
- Color system (Rice Paper light / Night Ink dark themes)
- Typography (Shippori Mincho, IBM Plex Sans/Mono)
- Animation patterns (scroll reveals, ink drawing, brush reveals)
- Component patterns (stone cards, CTA buttons, navigation)

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

<testing_philosophy>
Tests are executable specifications, not obstacles to silence. When a test fails, your first instinct should be curiosity, not deletion. A red test is a signal—investigate before you act.

Failing Test Response Protocol:
1. STOP. Do not touch the test file first.
2. ASK: "What behavior was this test protecting?"
3. INVESTIGATE: Is the production code now violating that expected behavior?
4. DECIDE: Did requirements change, or did implementation break?

If implementation broke → fix the production code, not the test.
If requirements changed → update the test to reflect new requirements, then update production code if needed.

Anti-patterns to avoid:
- "Fixing" assertions to match current (broken) behavior
- Deleting tests that fail without understanding why they existed
- Mocking away the actual problem to make tests green
- Commenting out failing tests "temporarily"
- Weakening assertions (e.g., changing exact match to contains, removing null checks)
- Treating test code as second-class citizens with lower quality standards

Tests are not bureaucratic overhead—they are living documentation of intended behavior. When you "fix" a test to pass without understanding the failure, you're destroying institutional knowledge and removing a guardrail.

Test Quality Standards:
- Tests should be as readable as production code—use descriptive names that explain the "what" and "why"
- Follow Arrange-Act-Assert structure for clarity
- One logical assertion per test; test one behavior, not one method
- Tests should fail for exactly one reason
- Prefer explicit setup over shared state; each test tells its own complete story

Red-Green-Refactor means: write a failing test FIRST, make it pass with minimal code, THEN refactor. Never skip the red phase—it validates that your test can actually fail.

When generating tests: think about edge cases, boundaries, null states, and failure modes. Don't just test the happy path. Ask: "How could this break in production?"
</testing_philosophy>

## Code Intelligence & Tools

**LSP**: `typescript-lsp` installed – use for jump to definition, find references, type checking.

**MCP Servers**:
- `context7` – library documentation lookup
- `playwright` – browser automation and testing
- `graphiti` – knowledge graph memory for codebase context

### Graphiti Memory (Knowledge Graph)

Knowledge graph for codebase memory. Use the **`/graphiti-memory`** skill when working on Votive.

**Group ID**: `votive-codebase` (hardcoded for all operations)

**Core Concepts**:
- **Episodes**: Content snippets (source text added to memory)
- **Nodes**: Entities extracted from episodes (services, types, packages)
- **Facts**: Relationships between nodes (e.g., "Backend depends on prompt-service")

**When to READ**: Query before file exploration for architecture questions, pattern discovery, component relationships, or project context.

**When to WRITE**: After adding new services/components, changing architecture, discovering undocumented patterns, or making design decisions with rationale.

**Pre-loaded Knowledge**: The `votive-codebase` group contains episodes covering:
- Project architecture and monorepo structure
- Domain types (assessment, analysis, prompts)
- 5-phase psychological framework
- Service layer patterns (circuit breaker, caching)
- Security implementation and configuration
- Key file locations and package relationships

See `.claude/skills/graphiti-memory/SKILL.md` for complete operations reference, naming conventions, and anti-patterns.

**Plugins**:
- `commit-commands` – structured commits
- `security-guidance` – security best practices
- `pr-review-toolkit` – PR review assistance
- `frontend-design` – UI/UX guidance
- `feature-dev` – feature development workflow

Leverage these tools proactively during development.

## Coding conventions enforcement:

CRITICAL: When working on this repository you must ensure to follow exisitng conventions, to ease this process utilize "npm run verify:conventions" command, execute that in the same manner as lint and type-check commands.
