# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Votive - a full-stack behavioral psychology assessment application with AI-powered analysis.

**Architecture**: Monorepo with four packages:
- `/app` - React frontend
- `/backend` - Express API proxy
- `/prompt-service` - Prompt management microservice with admin UI and A/B testing
- `/shared` - Shared TypeScript types (single source of truth)

## License & Contribution

**License**: Votive Source Available License (proprietary, non-commercial)
- View and study code: ✅
- Submit contributions: ✅
- Commercial use: ❌ (requires license)
- Redistribution: ❌

**Contribution Workflow**:
- Target `develop` branch (not `main`)
- Branch naming: `feature/short-desc`, `bugfix/issue-123-desc`, `docs/what-changed`
- Commit format: `type(scope): brief description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Security issues: Email konrad.jagusiak@oxilogic.com (not public issues)

## Build & Development Commands

### Frontend (`/app`)
```bash
npm run dev           # Vite dev server (https://localhost:3000)
npm run build         # TypeScript + Vite production build
npm run lint          # ESLint
npm run type-check    # TypeScript only
npm run test          # Vitest watch mode
npm run test:run      # Vitest single run
npm run test:coverage # Coverage report (80% threshold)
```

### Backend (`/backend`)
```bash
npm run dev           # tsx watch (https://localhost:3001)
npm run build         # TypeScript compile
npm run start         # Run compiled dist/
npm run lint          # ESLint
npm run type-check    # TypeScript only
npm run test          # Vitest
npm run test:coverage # Coverage report
```

### Prompt Service (`/prompt-service`)
```bash
npm run dev           # tsx watch (http://localhost:3002)
npm run build         # TypeScript compile
npm run start         # Run compiled dist/
npm run lint          # ESLint
npm run type-check    # TypeScript only
npm run test          # Vitest watch mode
npm run test:run      # Vitest single run
npm run test:coverage # Coverage report
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed initial prompt data
npm run admin:dev     # Vite dev server for admin UI
npm run admin:build   # Build admin UI
```

### Shared (`/shared`)
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript only
npm run test          # Vitest watch mode
npm run test:run      # Vitest single run
```

### Docker (Local Development)
```bash
docker compose up --build   # Build and run full stack
docker compose up           # Run existing images
docker compose down         # Stop containers
```
Requires `ANTHROPIC_API_KEY` and `DATABASE_KEY` environment variables.

### Docker (OCI Deployment)

**Run from Docker Hub OCI:**
```bash
ANTHROPIC_API_KEY=<key> DATABASE_KEY=<32+chars> docker compose -f oci://oxilith/votive-oci:latest up
```

**Build and publish multi-arch images:**
```bash
# Clean rebuild for multi-arch (linux/amd64 + linux/arm64)
docker rmi oxilith/votive-frontend:latest
docker rmi oxilith/votive-backend:latest
docker rmi oxilith/votive-prompt-service:latest
docker buildx prune -f

# Build and push using docker-bake.hcl
docker buildx bake --push --no-cache

# Publish OCI compose artifact (--resolve-image-digests for multi-arch)
docker compose publish --resolve-image-digests --with-env oxilith/votive-oci:latest
```

**Clear OCI cache (when images updated):**
```bash
# macOS
rm -rf "$HOME/Library/Caches/docker-compose/"
```

**Docker Hub repositories:**
- `oxilith/votive-backend` - Backend API (multi-arch)
- `oxilith/votive-frontend` - Nginx + React (multi-arch)
- `oxilith/votive-prompt-service` - Prompt microservice (multi-arch)
- `oxilith/votive-oci` - OCI compose artifact

See [docs/docker-hub.md](../docker-hub.md) for complete workflow documentation.

### HTTPS Setup (Local Development)
```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Generate certificates in project root
mkdir -p certs && cd certs
mkcert localhost 127.0.0.1 ::1
cd ..
```
Both frontend and backend use HTTPS by default in development.

## Code Standards

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

### Backend (`/backend/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...  # Required
PORT=3001
NODE_ENV=development
HTTPS_ENABLED=true
HTTPS_KEY_PATH=../certs/localhost+2-key.pem
HTTPS_CERT_PATH=../certs/localhost+2.pem
CORS_ORIGIN=https://localhost:3000
THINKING_ENABLED=true         # Feature flag for Claude extended thinking mode
```

### Frontend (`/app/.env`)
```
VITE_API_URL=https://localhost:3001
```

### Prompt Service (`/prompt-service/.env`)
```
DATABASE_URL=file:./data/prompts.db          # Required in production (no fallback)
DATABASE_KEY=<32+ character encryption key>  # Required
ADMIN_API_KEY=<admin authentication key>     # Required in production
SESSION_SECRET=<32+ char cookie signing>     # Required in production (separate from ADMIN_API_KEY for security)
PORT=3002
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Production Requirements**: In production, `DATABASE_URL`, `ADMIN_API_KEY`, and `SESSION_SECRET` are all required. `SESSION_SECRET` must be separate from `ADMIN_API_KEY` to prevent session forgery if the API key is compromised.

### Feature Flags

**`THINKING_ENABLED`** (backend) - Controls Claude's extended thinking mode:
- `true` (default): Uses extended thinking with 8000 token budget, temperature=1, max_tokens=16000
- `false`: Standard mode with temperature=0.6, max_tokens=8000

The prompt-service resolves the appropriate prompt configuration variant based on this flag.

## Testing

- Frontend: Vitest + React Testing Library + MSW for mocking
- Backend: Vitest + Supertest
- Prompt Service: Vitest (unit tests for services and middleware)
- Shared: Vitest (unit tests for validation and utilities)
- Test files: `**/__tests__/*.test.ts` or `**/*.test.tsx`
- Coverage thresholds: 80% lines/functions/statements, 75% branches

### Test Locations
- `app/src/**/__tests__/` - Frontend component and store tests
- `backend/src/**/__tests__/` - Backend service and controller tests
- `prompt-service/src/**/__tests__/` - A/B test service, auth middleware, error types, and validation tests
- `shared/src/__tests__/` - Validation constants and response formatter tests

## Domain Framework

5-phase psychological model (see `/docs/Motivation.md`):
1. **State Awareness** - Energy, mood, motivation patterns
2. **Identity Mapping** - Current self through behaviors/values
3. **Identity Design** - Aspirational identity with stepping-stones
4. **System Implementation** - Habit loops, environment design
5. **Feedback & Integration** - Progress tracking

**AI Analysis Output** (`AIAnalysisResult` type):
- `patterns` - Behavioral patterns with evidence
- `contradictions` - Tensions between values and behaviors
- `blindSpots` - Data-revealed but user-unseen insights
- `leveragePoints` - High-ROI areas for change
- `risks` - Why change attempts might fail
- `identitySynthesis` - Core identity, hidden strengths, next steps

## Docker Architecture

### Network Architecture
```
Browser → nginx (HTTPS :443) → backend (HTTP :3001)
                ↑
         SSL termination
```
- Frontend serves on HTTPS via nginx with SSL termination
- Backend runs HTTP only (no SSL needed - nginx handles it)
- API requests proxied: `/api/*` → `http://backend:3001`

### Build-time Configuration
- `VITE_API_URL` is a **build-time** variable (baked into JS bundle)
- For Docker: leave empty (`VITE_API_URL=`) so requests go through nginx proxy
- For local dev: set to `https://localhost:3001` in `.env.local`
- `.dockerignore` excludes `.env` files to prevent override

### Multi-Architecture Support
Images built for both `linux/amd64` and `linux/arm64`:
- Works on Intel/AMD x64 machines (Linux, Windows, older Macs)
- Works on ARM64 machines (Apple Silicon, AWS Graviton, Raspberry Pi)

### Shared Package in Docker

The shared package uses `file:../shared` dependency. In Docker:
- TypeScript compiles shared code to `dist/shared/src/`
- Dockerfile copies compiled shared to `node_modules/shared/` at runtime
- Backend imports resolve to `node_modules/shared/` in production

### Container Setup
- Frontend: Nginx Alpine serving Vite build on port 443 (HTTPS)
- Backend: Node.js 22 Alpine running Express on port 3001
- Backend health check (`/health`) required before frontend starts
- Non-root user (expressjs) in backend container for security
- Certificates volume mount: `${PWD}/certs:/etc/nginx/ssl`
- Self-signed certs auto-generated if not provided (browser warning)

## Test Data

Sample personas in `/personas/`:
- `persona-1-burned-out-achiever-{en,pl}.json`
- `persona-2-scattered-creative-{en,pl}.json`
- `persona-3-careful-planner-{en,pl}.json`
