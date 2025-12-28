# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**See also**: @README.md for user-facing documentation, setup instructions, and feature overview.

## Project Overview

Votive - a full-stack behavioral psychology assessment application with AI-powered analysis.

**Architecture**: Monorepo with four packages:
- `/app` - React 19 frontend (Vite + Zustand + Tailwind v4)
- `/backend` - Express API proxy (protects Anthropic API key)
- `/prompt-service` - Prompt management microservice with admin UI and A/B testing
- `/shared` - Shared TypeScript types (single source of truth)

## Commands

All commands run from project root via npm workspaces:

```bash
# Development
npm run dev:app                  # Frontend (https://localhost:3000)
npm run dev:backend              # Backend (https://localhost:3001)
npm run dev:prompt-service       # Prompt service API (http://localhost:3002)
npm run dev:prompt-service:all   # Prompt service API + admin UI

# Quality
npm run lint                     # Lint all projects
npm run type-check               # Type-check all projects
npm run test:run                 # Run all tests (once)
npm run test:coverage            # Run all tests with coverage

# Build & Production
npm run build                    # Build all projects
npm run start:backend            # Run compiled backend
npm run start:prompt-service     # Run compiled prompt-service

# Database (prompt-service)
npm run db:migrate               # Run migrations
npm run db:generate              # Generate Prisma client
npm run db:seed                  # Seed initial data
npm run db:studio                # Open Prisma Studio

# Per-workspace
npm run test -w backend          # Run tests in specific workspace
```

## Contribution

- Target `develop` branch (not `main`)
- Branch naming: `feature/short-desc`, `bugfix/issue-123-desc`, `docs/what-changed`
- Commit format: `type(scope): brief description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Security issues: Email konrad.jagusiak@oxilogic.com (not public issues)

## Docker

```bash
# Local development
docker compose up --build   # Build and run full stack

# Production (OCI deployment)
ANTHROPIC_API_KEY=<key> DATABASE_KEY=<32+chars> ADMIN_API_KEY=<32+chars> SESSION_SECRET=<32+chars> \
  docker compose -f oci://oxilith/votive-oci:latest up
```

See [docs/docker-hub.md](../docker-hub.md) for complete workflow documentation.

### HTTPS Setup (Local Development)
```bash
brew install mkcert && mkcert -install
mkdir -p certs && cd certs && mkcert localhost 127.0.0.1 ::1
```

## Code Standards

### Environment Files
- **NEVER read or edit `.env` files** - these contain secrets and should not be accessed
- **Exception**: `.env.example` files may be read and edited to document required configuration
- When setting up a new environment, populate `.env.example` with all required variable names and placeholder/example values
- **docker-compose.yml**: Use `${VARIABLE}` syntax for sensitive values so they're injected at runtime, not hardcoded:
  ```yaml
  environment:
    - NODE_ENV=production          # Safe: non-sensitive
    - DATABASE_KEY=${DATABASE_KEY} # Required: injected from environment
    - ADMIN_API_KEY=${ADMIN_API_KEY}
  ```

### TypeScript
- **No `any` types** - use specific types or `unknown`
- **Path aliases** - always use `@/` imports, never relative paths
- **Shared types** - use `shared/` for types shared between frontend/backend (not `@shared/`)
- **Strict mode** - `noUnusedLocals`, `noUnusedParameters` enforced
- Use `React.ComponentRef` (not deprecated `React.ElementRef`)
- **Anthropic SDK types** - use `ThinkingConfigParam` from `@anthropic-ai/sdk/resources/messages` (not custom types)

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
- `api.types.ts` - API types (AnalysisLanguage, SUPPORTED_LANGUAGES)
- `labels.ts` - Human-readable label mappings for enum values
- `validation.ts` - Enum value arrays for Zod schemas, REQUIRED_FIELDS, field categorization (ARRAY_FIELDS, NUMBER_FIELDS, STRING_FIELDS)
- `responseFormatter.ts` - Shared `formatResponsesForPrompt()` function for AI analysis
- `prompt.types.ts` - Prompt config types (ClaudeModel, PromptConfig, ThinkingVariant, PromptConfigDefinition)
- `index.ts` - Barrel exports

Import via `shared/index` in packages (e.g., `import { ... } from 'shared/index'`).

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

### Frontend (`/app/src`)

**State Management** - Zustand stores (not Redux):
- `stores/useAssessmentStore.ts` - Assessment responses with localStorage persistence
- `stores/useUIStore.ts` - View state, navigation, loading/error
- `stores/useAnalysisStore.ts` - AI analysis results

**Service Layer**:
- `services/api/ApiClient.ts` - HTTP client with retry logic, timeout handling
- `services/api/ClaudeService.ts` - Backend API calls for analysis
- `services/interfaces/` - TypeScript interfaces for dependency injection

**Key Directories**:
- `components/assessment/` - Multi-phase questionnaire wizard (split into steps/, hooks/, navigation/)
- `components/insights/` - AI analysis display
- `components/shared/` - Header, theme toggle
- `styles/theme.ts` - Shared Tailwind utilities (cardStyles, textStyles)
- `i18n/resources/` - Translations (en/, pl/)
- `config/` - Application configuration

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
```

## Environment Variables

See [docs/production-deployment.md](../production-deployment.md#environment-variables) for complete reference.

Key variables:
- `VITE_API_URL` - Frontend build-time (leave empty for Docker, set to `https://localhost:3001` for local dev)
- `ANTHROPIC_API_KEY` - Claude API key
- `DATABASE_KEY` / `ADMIN_API_KEY` / `SESSION_SECRET` - 32+ char secrets for prompt-service
- `THINKING_ENABLED` - Backend flag for Claude extended thinking mode (default: true)

## Testing

- All packages use Vitest with 80% coverage thresholds (75% branches)
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
- Shared package compiled to `dist/shared/src/`, copied to `node_modules/shared/` at runtime
- Backend uses non-root user (expressjs) for security

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
