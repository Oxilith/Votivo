# Votive Testing Strategy

## Overview

The Votive codebase uses **Vitest** as the unified test runner across all 5 workspaces with consistent patterns and quality gates.

## Frameworks & Tools

| Tool | Purpose | Version |
|------|---------|---------|
| Vitest | Test runner | v4.0.16 |
| React Testing Library | Component testing | v16.0.0 |
| @testing-library/user-event | User interactions | v14.5.0 |
| Supertest | API testing | v7.0.0+ |
| @vitest/coverage-v8 | Coverage provider | v4.0.16 |

**Mocking**: Vitest's `vi.mock()` and `vi.fn()` (MSW installed but not actively used)

## Coverage Requirements

| Workspace | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| app | 80% | 80% | 75% | 80% |
| backend | 80% | 80% | 75% | 80% |
| worker | 80% | 80% | 75% | 80% |
| shared | No threshold | - | - | - |
| prompt-service | No threshold | - | - | - |

**Coverage output**: text, JSON, HTML, LCOV in `./coverage` directory

## Test Organization

### File Structure Patterns

```
Pattern 1 - Co-located __tests__:
src/stores/__tests__/useAssessmentStore.test.ts
src/services/__tests__/ApiClient.test.ts

Pattern 2 - Feature-grouped:
src/__tests__/middleware/csrf.middleware.test.ts
src/__tests__/integration/jwt-protected-routes.test.ts
```

### Naming Convention

- Files: `*.test.ts` or `*.test.tsx`
- Match module name: `ApiClient.ts` → `ApiClient.test.ts`

### Test Count: ~27 test files

- Frontend: 7 (components, services, stores)
- Backend: 4 (services, utilities)
- Prompt Service: 11 (middleware, services, utils)
- Worker: 3 (jobs, scheduler, config)
- Shared: 2 (validation, formatting)

## Configuration Files

| Workspace | Config | Environment | Setup File |
|-----------|--------|-------------|------------|
| app | `vitest.config.ts` | jsdom | `src/test/setup.ts` |
| backend | `vitest.config.ts` | node | `vitest.setup.ts` |
| prompt-service | `vitest.config.ts` | node | `vitest.setup.ts` |
| worker | `vitest.config.ts` | node | - |
| shared | `vitest.config.ts` | node | - |

## Test Types

### Unit Tests (~22 files)

- Store/state: `useAssessmentStore.test.ts`, `useUIStore.test.ts`
- Services: `ApiClient.test.ts`, `AuthService.test.ts`, `prompt.service.test.ts`
- Components: `LoginForm.test.tsx`, `RegisterForm.test.tsx`
- Utilities: `responseFormatter.test.ts`, `validation.test.ts`

### Middleware Tests (~3 files)

- `csrf.middleware.test.ts` - CSRF protection
- `jwt-auth.middleware.test.ts` - Token validation
- `admin-auth.middleware.test.ts` - Admin auth

### Job/Scheduler Tests (~2 files)

- `token-cleanup.job.test.ts` - Background job execution
- `scheduler.test.ts` - Cron scheduler

### E2E Tests

- None currently implemented

## Mocking Strategies

### Frontend (jsdom environment)

```typescript
// Module mocking
vi.mock('@/services/api/AuthService', () => ({
  authService: { login: mockLogin }
}))

// Browser APIs (in setup.ts)
vi.mock('window.localStorage')
vi.mock('window.matchMedia')
```

### Backend (node environment)

```typescript
// Hoisted mocks for Prisma
const mockPrisma = vi.hoisted(() => ({
  refreshToken: { deleteMany: vi.fn() }
}))
vi.mock('@/prisma', () => ({
  createFreshPrismaClient: () => mockPrisma
}))

// Fake timers
vi.useFakeTimers()
vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
```

## Test Commands

```bash
# Root level (all workspaces)
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage

# Workspace specific
npm run test -w app
npm run test:run -w backend
npm run test:coverage -w prompt-service
```

## Setup Files Summary

### Frontend (`app/src/test/setup.ts`)

- Imports `@testing-library/jest-dom/vitest`
- Mocks `window.matchMedia`, `localStorage`, `fetch`
- Clears mocks after each test

### Backend (`backend/vitest.setup.ts`)

- Sets `ANTHROPIC_API_KEY` for tests
- Sets `NODE_ENV=test`, `LOG_LEVEL=error`

### Prompt Service (`prompt-service/vitest.setup.ts`)

- Sets security secrets (SESSION_SECRET, DATABASE_KEY, JWT secrets)
- Sets `NODE_ENV=test`, `LOG_LEVEL=error`

## Best Practices Observed

1. **Arrange-Act-Assert** pattern consistently used
2. **Isolated test state** - `beforeEach` clears mocks and resets stores
3. **Type-safe mocking** - `vi.mocked()` for TypeScript inference
4. **Grouped tests** - `describe()` blocks for logical organization
5. **Inline fixtures** - No shared fixtures directory; test data created per test
6. **No `any` types** - Strict TypeScript in tests

## Quality Gates

```bash
npm run lint           # ESLint
npm run type-check     # TypeScript
npm run test:run       # All tests pass
npm run test:coverage  # Coverage thresholds met
```

## Key Files

- `app/vitest.config.ts` - Frontend config (jsdom)
- `app/src/test/setup.ts` - Frontend setup
- `backend/vitest.config.ts` - Backend config
- `backend/vitest.setup.ts` - Backend setup
- `prompt-service/vitest.config.ts` - Prompt service config
- `prompt-service/vitest.setup.ts` - Prompt service setup
- `worker/vitest.config.ts` - Worker config
- `shared/vitest.config.ts` - Shared config

## Gaps & Opportunities

1. **No E2E tests** - Consider Playwright for critical user flows
2. **MSW unused** - Installed but not integrated; could improve API mocking
3. **No shared fixtures** - Test data is duplicated across files
4. **Inconsistent thresholds** - shared/prompt-service lack coverage enforcement
5. **No visual regression** - Component testing is logic-only
