# Votive Testing Strategy (To-Be)

## Philosophy

Follow the Testing Pyramid to maximize confidence while minimizing maintenance cost and execution time. Tests should be deterministic, fast, and provide clear failure signals.

```
           /\
          /  \           E2E (Playwright)
         / 5% \          ~5-8 critical user journeys
        /------\         Slow, expensive, high confidence
       /        \
      /   15%    \       Integration Tests
     /            \      ~30-40 tests across services
    /--------------\     API routes, DB operations, middleware chains
   /                \
  /       80%        \   Unit Tests
 /                    \  ~150+ tests
/----------------------\ Fast, isolated, focused
```

## Test Distribution Targets

| Workspace | Unit | Integration | E2E | Total Target |
|-----------|------|-------------|-----|--------------|
| shared | 20+ | - | - | 20+ |
| app | 40+ | 5-10 | - | 50+ |
| backend | 30+ | 15-20 | - | 50+ |
| prompt-service | 30+ | 10-15 | - | 45+ |
| worker | 15+ | 5-10 | - | 25+ |
| e2e (new) | - | - | 5-8 | 5-8 |
| **Total** | **135+** | **35-55** | **5-8** | **~200** |

## Architecture

```
votive/
├── shared/
│   ├── src/
│   │   ├── testing/              # NEW: Shared test infrastructure
│   │   │   ├── index.ts          # Barrel export
│   │   │   ├── fixtures/         # Factory functions
│   │   │   ├── mocks/            # Reusable mocks
│   │   │   ├── matchers/         # Custom Vitest matchers
│   │   │   └── utils/            # Test helpers
│   │   └── ...
│   └── package.json
├── e2e/                          # NEW: E2E test workspace
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── assessment.spec.ts
│   │   └── admin.spec.ts
│   ├── fixtures/                 # Playwright fixtures
│   ├── playwright.config.ts
│   └── package.json
└── ...
```

## Layer 1: Unit Tests (80%)

### What to Unit Test

- Pure functions and utilities
- Validation logic
- State management (stores)
- Service methods (dependencies mocked)
- React components (isolated)
- Error handling paths
- Edge cases and boundary conditions

### Patterns

```typescript
// Use shared fixtures
import { createMockUser, createMockAssessment } from 'shared/testing';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockRepo: MockedObject<AssessmentRepository>;

  beforeEach(() => {
    mockRepo = vi.mocked({
      findById: vi.fn(),
      save: vi.fn(),
    });
    service = new AssessmentService(mockRepo);
  });

  it('calculates score correctly', async () => {
    // Arrange
    const assessment = createMockAssessment({ answers: [1, 2, 3] });
    mockRepo.findById.mockResolvedValue(assessment);

    // Act
    const result = await service.calculateScore('assessment-1');

    // Assert
    expect(result.score).toBe(6);
  });
});
```

### Coverage Requirements

| Workspace | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| shared | 90% | 90% | 85% | 90% |
| app | 80% | 80% | 75% | 80% |
| backend | 85% | 85% | 80% | 85% |
| prompt-service | 85% | 85% | 80% | 85% |
| worker | 80% | 80% | 75% | 80% |

## Layer 2: Integration Tests (15%)

### What to Integration Test

- API route handlers with full middleware chain
- Database operations (using test database)
- Authentication/authorization flows
- Cross-service communication
- External API integrations (with MSW)

### Database Strategy

```typescript
// shared/src/testing/db.ts
import { PrismaClient } from '@prisma/client';

let testPrisma: PrismaClient | null = null;

export async function getTestPrisma(): Promise<PrismaClient> {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL }
      }
    });
  }
  return testPrisma;
}

export async function cleanupTestDb(prisma: PrismaClient): Promise<void> {
  // Delete in order respecting foreign keys
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function disconnectTestDb(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}
```

### API Integration Pattern

```typescript
// backend/src/__tests__/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app';
import { getTestPrisma, cleanupTestDb, disconnectTestDb } from 'shared/testing';
import { createMockUser } from 'shared/testing';

describe('Auth API Integration', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await getTestPrisma();
    app = createApp({ prisma });
    request = supertest(app);
  });

  beforeEach(async () => {
    await cleanupTestDb(prisma);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      // Arrange - create real user in test DB
      const userData = createMockUser();
      await prisma.user.create({ data: userData });

      // Act
      const response = await request
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'password123' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 for invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
```

### MSW for External APIs

```typescript
// shared/src/testing/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      content: [{ type: 'text', text: 'Mocked response' }],
      usage: { input_tokens: 10, output_tokens: 20 }
    });
  }),
];

export const handlers = [...anthropicHandlers];
```

```typescript
// shared/src/testing/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Integration Test File Naming

```
*.integration.test.ts    # Integration tests
*.test.ts                # Unit tests (default)
```

## Layer 3: E2E Tests (5%)

### Critical User Journeys Only

| Test | Priority | Description |
|------|----------|-------------|
| `auth.spec.ts` | P0 | Login → Access protected route → Logout |
| `assessment.spec.ts` | P0 | Start assessment → Complete → View results |
| `admin.spec.ts` | P1 | Admin login → Manage prompts → Preview |
| `token-refresh.spec.ts` | P1 | Session expires → Auto refresh → Continue |
| `error-recovery.spec.ts` | P2 | Network error → Retry → Success |

### E2E Workspace Setup

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Run local dev server before tests (development only)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev -w app',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

### E2E Test Pattern

```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can login and access dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Fill credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});
```

### Docker Integration for E2E

```yaml
# docker-compose.test.yml
services:
  app:
    build:
      context: .
      dockerfile: app/Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - DATABASE_URL=file:/data/test.db
      - NODE_ENV=test
    volumes:
      - test-data:/data

  prompt-service:
    build:
      context: .
      dockerfile: prompt-service/Dockerfile
    environment:
      - DATABASE_URL=file:/data/prompts.db
      - NODE_ENV=test

  e2e:
    build:
      context: .
      dockerfile: e2e/Dockerfile
    depends_on:
      - app
      - backend
    environment:
      - E2E_BASE_URL=http://app:80
    volumes:
      - ./e2e/playwright-report:/app/e2e/playwright-report

volumes:
  test-data:
```

## Shared Testing Infrastructure

### Package Exports

```typescript
// shared/src/testing/index.ts
// Fixtures
export * from './fixtures/user.fixture';
export * from './fixtures/assessment.fixture';
export * from './fixtures/prompt.fixture';

// Mocks
export * from './mocks/prisma.mock';
export * from './mocks/server';
export * from './mocks/handlers';

// Database utilities
export * from './db';

// Custom matchers
export * from './matchers';

// Test utilities
export * from './utils';
```

### Fixture Factories

```typescript
// shared/src/testing/fixtures/user.fixture.ts
import { faker } from '@faker-js/faker';

export interface MockUserOptions {
  id?: string;
  email?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

export function createMockUser(options: MockUserOptions = {}) {
  return {
    id: options.id ?? faker.string.uuid(),
    email: options.email ?? faker.internet.email(),
    passwordHash: '$2b$10$hashedpassword', // Pre-computed for 'password123'
    role: options.role ?? 'user',
    verified: options.verified ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockUserInput(overrides = {}) {
  return {
    email: faker.internet.email(),
    password: 'Password123!',
    ...overrides,
  };
}
```

### Prisma Mock

```typescript
// shared/src/testing/mocks/prisma.mock.ts
import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { DeepMockProxy } from 'vitest-mock-extended';
import { mockDeep, mockReset } from 'vitest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const mockPrisma = mockDeep<PrismaClient>();

export function resetPrismaMock() {
  mockReset(mockPrisma);
}

// Factory for creating scoped mocks
export function createMockPrisma(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}
```

### Custom Matchers

```typescript
// shared/src/testing/matchers/index.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidJWT(received: string) {
    const parts = received.split('.');
    const pass = parts.length === 3 && parts.every(p => p.length > 0);
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid JWT`
        : `expected ${received} to be a valid JWT (header.payload.signature)`,
    };
  },

  toHaveStatusCode(response: { status: number }, expected: number) {
    const pass = response.status === expected;
    return {
      pass,
      message: () => `expected status ${response.status} to be ${expected}`,
    };
  },
});

// Type declarations
declare module 'vitest' {
  interface Assertion<T> {
    toBeValidJWT(): T;
    toHaveStatusCode(status: number): T;
  }
}
```

## CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '22'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build -w shared
      - run: npm run db:generate -w prompt-service
      - run: npm run lint
      - run: npm run type-check

  unit-test:
    name: Unit Tests
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build -w shared
      - run: npm run db:generate -w prompt-service
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v5
        with:
          files: ./app/coverage/lcov.info,./backend/coverage/lcov.info,./prompt-service/coverage/lcov.info,./worker/coverage/lcov.info
          fail_ci_if_error: true

  integration-test:
    name: Integration Tests
    needs: lint
    runs-on: ubuntu-latest
    services:
      # If using external test DB
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build -w shared
      - run: npm run db:generate -w prompt-service
      - run: npm run test:integration
        env:
          TEST_DATABASE_URL: file:./test.db

  build:
    name: Build
    needs: [unit-test, integration-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run db:generate -w prompt-service
      - run: npm run build
      - uses: actions/upload-artifact@v6
        with:
          name: build-artifacts
          path: |
            app/dist
            backend/dist
            prompt-service/dist
            worker/dist
          retention-days: 7

  e2e-test:
    name: E2E Tests
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v6
      
      - uses: actions/download-artifact@v6
        with:
          name: build-artifacts
      
      - name: Start services
        run: docker compose -f docker-compose.test.yml up -d --wait
      
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Playwright
        run: |
          cd e2e
          npm ci
          npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:5173
      
      - uses: actions/upload-artifact@v6
        if: failure()
        with:
          name: playwright-report
          path: e2e/playwright-report
          retention-days: 7
      
      - name: Stop services
        if: always()
        run: docker compose -f docker-compose.test.yml down -v
```

## Test Commands

```json
// root package.json scripts
{
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "test:run": "npm run test:run --workspaces --if-present",
    "test:unit": "npm run test:unit --workspaces --if-present",
    "test:integration": "npm run test:integration --workspaces --if-present",
    "test:coverage": "npm run test:coverage --workspaces --if-present",
    "test:e2e": "npm run test -w e2e",
    "test:e2e:ui": "npm run test:ui -w e2e"
  }
}
```

```json
// workspace package.json scripts (backend example)
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:unit": "vitest run --exclude '**/*.integration.test.ts'",
    "test:integration": "vitest run --include '**/*.integration.test.ts'",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Quality Gates

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| Unit test pass rate | 100% | CI blocks merge |
| Integration test pass rate | 100% | CI blocks merge |
| E2E test pass rate | 100% | CI blocks merge (main/develop only) |
| Coverage (app) | 80% lines | CI blocks merge |
| Coverage (backend) | 85% lines | CI blocks merge |
| Coverage (prompt-service) | 85% lines | CI blocks merge |
| Coverage (worker) | 80% lines | CI blocks merge |
| Coverage (shared) | 90% lines | CI blocks merge |

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|--------------|--------------|------------|
| Testing implementation details | Brittle tests | Test behavior/outcomes |
| Shared mutable state between tests | Flaky tests | Reset state in beforeEach |
| Sleep/delays in tests | Slow, flaky | Use proper async waiting |
| Testing third-party code | Wasted effort | Trust libraries, mock boundaries |
| E2E for edge cases | Slow, expensive | Unit test edge cases |
| Snapshot overuse | Meaningless diffs | Explicit assertions |
| console.log debugging | Cluttered output | Use debugger/test.only |

## Key Principles

1. **Tests are documentation** - They show how code should be used
2. **Fast feedback** - Unit tests run in <10s, full suite <5min
3. **Deterministic** - Same input = same output, always
4. **Independent** - Tests can run in any order
5. **DRY infrastructure** - Share fixtures/mocks, not test logic
6. **Test behavior, not implementation** - Refactoring shouldn't break tests
