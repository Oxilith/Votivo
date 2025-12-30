# Testing Strategy Migration Plan

## Executive Summary

Migrate from current ad-hoc testing (~27 tests) to a structured Testing Pyramid approach (~200 tests) over 6-8 weeks. The migration is incremental—each phase delivers value independently.

## Current State Assessment

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Total test files | 27 | ~200 | +173 |
| Unit tests | ~22 | ~135 | +113 |
| Integration tests | ~5 | ~55 | +50 |
| E2E tests | 0 | 5-8 | +8 |
| Shared test utilities | None | Comprehensive | New |
| Coverage enforcement | Partial (3/5 workspaces) | All workspaces | +2 |
| MSW usage | Installed, unused | Active | Enable |
| Test data | Duplicated per file | Shared fixtures | Refactor |

## Migration Phases

```
Week 1-2          Week 3-4          Week 5-6          Week 7-8
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Phase 1  │ ───► │ Phase 2  │ ───► │ Phase 3  │ ───► │ Phase 4  │
│Foundation│      │  Unit    │      │Integration│     │   E2E    │
│          │      │  Tests   │      │  Tests    │     │  Tests   │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

---

## Phase 1: Foundation (Week 1-2)

### Goal
Establish shared testing infrastructure without disrupting existing tests.

### Tasks

#### 1.1 Create Shared Testing Module

```bash
# In shared/src/testing/
mkdir -p shared/src/testing/{fixtures,mocks,matchers,utils}
```

**Files to create:**

```typescript
// shared/src/testing/index.ts
export * from './fixtures';
export * from './mocks';
export * from './matchers';
export * from './utils';
export * from './db';
```

```typescript
// shared/src/testing/fixtures/index.ts
export * from './user.fixture';
export * from './assessment.fixture';
export * from './prompt.fixture';
export * from './token.fixture';
```

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
    passwordHash: '$2b$10$K8GpPw9t6X9Z0vC3Y5rQxOq5b5f5h5h5h5h5h5h5h5h5h5h5h5h5',
    role: options.role ?? 'user',
    verified: options.verified ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// For API request bodies
export function createMockUserInput(overrides: Partial<{ email: string; password: string }> = {}) {
  return {
    email: faker.internet.email(),
    password: 'Password123!',
    ...overrides,
  };
}

// Batch creation
export function createMockUsers(count: number, options: MockUserOptions = {}) {
  return Array.from({ length: count }, () => createMockUser(options));
}
```

```typescript
// shared/src/testing/mocks/prisma.mock.ts
import { vi } from 'vitest';

// Type-safe deep mock factory
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    assessment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    prompt: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback()),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
```

```typescript
// shared/src/testing/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'msg_mock',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Mocked Claude response' }],
      model: body.model,
      usage: { input_tokens: 10, output_tokens: 20 },
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

export function setupMswServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
```

```typescript
// shared/src/testing/db.ts
import { PrismaClient } from '@prisma/client';

let testClient: PrismaClient | null = null;

export async function getTestPrisma(): Promise<PrismaClient> {
  if (!testClient) {
    testClient = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL || 'file:./test.db' },
      },
    });
    await testClient.$connect();
  }
  return testClient;
}

export async function cleanupTestDb(prisma: PrismaClient): Promise<void> {
  const tables = ['RefreshToken', 'Assessment', 'User', 'Prompt'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (testClient) {
    await testClient.$disconnect();
    testClient = null;
  }
}
```

```typescript
// shared/src/testing/matchers/index.ts
import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
  toBeValidJWT(): R;
  toBeValidUUID(): R;
  toBeWithinSeconds(expected: Date, seconds: number): R;
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    return {
      pass,
      message: () => `expected "${received}" ${pass ? 'not ' : ''}to be a valid JWT`,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      pass,
      message: () => `expected "${received}" ${pass ? 'not ' : ''}to be a valid UUID`,
    };
  },

  toBeWithinSeconds(received: Date, expected: Date, seconds: number) {
    const diff = Math.abs(received.getTime() - expected.getTime()) / 1000;
    const pass = diff <= seconds;
    return {
      pass,
      message: () => `expected ${received} to be within ${seconds}s of ${expected} (diff: ${diff}s)`,
    };
  },
});

export {};
```

```typescript
// shared/src/testing/utils/index.ts
import { vi } from 'vitest';

// Wait for all pending promises
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

// Create mock Express request
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    get: vi.fn((header: string) => (overrides as Record<string, unknown>).headers?.[header]),
    ...overrides,
  };
}

// Create mock Express response
export function createMockResponse() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res;
}

// Advance timers and flush promises
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await flushPromises();
}
```

#### 1.2 Install Dependencies

```bash
# Root level - shared testing dependencies
npm install -D @faker-js/faker vitest-mock-extended -w shared

# Ensure MSW is properly configured
npm install -D msw@latest -w shared
```

#### 1.3 Update Shared Package Exports

```typescript
// shared/src/index.ts - add to existing exports
export * from './testing';
```

```json
// shared/package.json - update exports map
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./testing": {
      "types": "./dist/testing/index.d.ts",
      "import": "./dist/testing/index.js"
    }
  }
}
```

#### 1.4 Update tsup Config

```typescript
// shared/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/testing/index.ts', // Add testing entry point
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['vitest', 'msw'], // Don't bundle test dependencies
});
```

### Deliverables
- [ ] `shared/src/testing/` directory structure
- [ ] Fixture factories for all domain entities
- [ ] Mock Prisma client factory
- [ ] MSW handlers for external APIs
- [ ] Custom Vitest matchers
- [ ] Express mock utilities
- [ ] Updated shared package exports

### Validation
```bash
npm run build -w shared
npm run test -w shared  # New tests for fixtures should pass
```

---

## Phase 2: Strengthen Unit Tests (Week 3-4)

### Goal
Increase unit test coverage to target levels using shared infrastructure.

### Tasks

#### 2.1 Migrate Existing Tests to Use Shared Fixtures

**Before:**
```typescript
// backend/src/__tests__/services/AuthService.test.ts
describe('AuthService', () => {
  it('creates user', async () => {
    const mockUser = {
      id: '123',
      email: 'test@test.com',
      passwordHash: 'hash',
      role: 'user',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // ...
  });
});
```

**After:**
```typescript
// backend/src/__tests__/services/AuthService.test.ts
import { createMockUser, createMockPrisma } from 'shared/testing';

describe('AuthService', () => {
  it('creates user', async () => {
    const mockUser = createMockUser({ email: 'test@test.com' });
    const mockPrisma = createMockPrisma();
    // ...
  });
});
```

#### 2.2 Add Missing Unit Tests

**Priority order by workspace:**

| Workspace | Current | Target | Priority Files to Test |
|-----------|---------|--------|------------------------|
| backend | 4 | 30+ | Services (JWT, Auth, User), Validators, Utils |
| app | 7 | 40+ | Remaining stores, All services, Hooks |
| prompt-service | 11 | 30+ | All services, Validators |
| worker | 3 | 15+ | All jobs, Queue utilities |
| shared | 2 | 20+ | All validators, Formatters, Type guards |

**Test file checklist for backend:**
```
src/__tests__/services/
├── AuthService.test.ts          ✅ Exists
├── JwtService.test.ts           ⬜ Create
├── UserService.test.ts          ⬜ Create
├── TokenService.test.ts         ⬜ Create
└── RefreshTokenService.test.ts  ⬜ Create

src/__tests__/validators/
├── auth.validator.test.ts       ⬜ Create
├── user.validator.test.ts       ⬜ Create
└── input.validator.test.ts      ⬜ Create

src/__tests__/utils/
├── crypto.utils.test.ts         ⬜ Create
├── date.utils.test.ts           ⬜ Create
└── response.utils.test.ts       ⬜ Create
```

#### 2.3 Update Vitest Configs for Test Separation

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'], // Separate integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.integration.test.ts',
        'src/__tests__/**',
        'src/types/**',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'shared/testing': path.resolve(__dirname, '../shared/src/testing'),
    },
  },
});
```

#### 2.4 Update Package Scripts

```json
// backend/package.json
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

#### 2.5 Enable Coverage for All Workspaces

Update `shared/vitest.config.ts` and `prompt-service/vitest.config.ts` to include coverage thresholds:

```typescript
// shared/vitest.config.ts
coverage: {
  thresholds: {
    lines: 90,
    functions: 90,
    branches: 85,
    statements: 90,
  },
},
```

### Deliverables
- [ ] All existing tests migrated to use shared fixtures
- [ ] 50+ new unit tests across workspaces
- [ ] Vitest configs updated for test separation
- [ ] Coverage thresholds enforced on all workspaces
- [ ] All tests passing with coverage met

### Validation
```bash
npm run test:unit          # All unit tests pass
npm run test:coverage      # All coverage thresholds met
```

---

## Phase 3: Integration Tests (Week 5-6)

### Goal
Add integration tests for API routes and database operations.

### Tasks

#### 3.1 Create Integration Test Infrastructure

```typescript
// backend/src/__tests__/integration/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPrisma, cleanupTestDb, disconnectTestDb } from 'shared/testing';
import type { PrismaClient } from '@prisma/client';

export let prisma: PrismaClient;

export function setupIntegrationTests() {
  beforeAll(async () => {
    prisma = await getTestPrisma();
  });

  beforeEach(async () => {
    await cleanupTestDb(prisma);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });
}
```

#### 3.2 Add Integration Tests

**Priority integration tests:**

```typescript
// backend/src/__tests__/integration/auth-routes.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app';
import { setupIntegrationTests, prisma } from './setup';
import { createMockUser, createMockUserInput } from 'shared/testing';

describe('Auth Routes Integration', () => {
  setupIntegrationTests();
  
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(() => {
    const app = createApp({ prisma });
    request = supertest(app);
  });

  describe('POST /api/auth/register', () => {
    it('creates new user and returns tokens', async () => {
      const input = createMockUserInput();

      const response = await request
        .post('/api/auth/register')
        .send(input)
        .expect(201);

      expect(response.body.user.email).toBe(input.email);
      expect(response.body.accessToken).toBeValidJWT();
      expect(response.headers['set-cookie']).toBeDefined();

      // Verify user in database
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      expect(user).toBeTruthy();
    });

    it('returns 409 for duplicate email', async () => {
      const existingUser = createMockUser();
      await prisma.user.create({ data: existingUser });

      await request
        .post('/api/auth/register')
        .send({ email: existingUser.email, password: 'Password123!' })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      // Create user with known password
      const password = 'Password123!';
      const user = createMockUser();
      // Hash password properly for test
      await prisma.user.create({
        data: {
          ...user,
          passwordHash: await hashPassword(password),
        },
      });

      const response = await request
        .post('/api/auth/login')
        .send({ email: user.email, password })
        .expect(200);

      expect(response.body.accessToken).toBeValidJWT();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('issues new tokens with valid refresh token', async () => {
      // Setup: Create user and login to get refresh token
      // ...test implementation
    });
  });
});
```

```typescript
// backend/src/__tests__/integration/jwt-protected-routes.integration.test.ts
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createApp } from '@/app';
import { setupIntegrationTests, prisma } from './setup';
import { createMockUser } from 'shared/testing';
import { generateAccessToken } from '@/services/JwtService';

describe('JWT Protected Routes Integration', () => {
  setupIntegrationTests();

  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(() => {
    const app = createApp({ prisma });
    request = supertest(app);
  });

  it('allows access with valid token', async () => {
    const user = createMockUser();
    await prisma.user.create({ data: user });
    const token = generateAccessToken(user);

    await request
      .get('/api/protected/resource')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects expired token with 401', async () => {
    const user = createMockUser();
    const expiredToken = generateAccessToken(user, { expiresIn: '-1h' });

    await request
      .get('/api/protected/resource')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('rejects invalid token with 401', async () => {
    await request
      .get('/api/protected/resource')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });

  it('rejects missing token with 401', async () => {
    await request
      .get('/api/protected/resource')
      .expect(401);
  });
});
```

#### 3.3 Add MSW Integration for External Services

```typescript
// prompt-service/src/__tests__/integration/claude.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server, setupMswServer } from 'shared/testing';
import { http, HttpResponse } from 'msw';
import { ClaudeService } from '@/services/ClaudeService';

describe('Claude Service Integration', () => {
  setupMswServer();

  it('handles successful response', async () => {
    const service = new ClaudeService();
    const result = await service.generateResponse('Hello');
    
    expect(result.content).toBe('Mocked Claude response');
    expect(result.usage.input_tokens).toBe(10);
  });

  it('handles rate limit error', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        return HttpResponse.json(
          { error: { type: 'rate_limit_error', message: 'Rate limited' } },
          { status: 429 }
        );
      })
    );

    const service = new ClaudeService();
    await expect(service.generateResponse('Hello')).rejects.toThrow('Rate limited');
  });

  it('handles network error', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => {
        return HttpResponse.error();
      })
    );

    const service = new ClaudeService();
    await expect(service.generateResponse('Hello')).rejects.toThrow();
  });
});
```

#### 3.4 Database Integration Tests

```typescript
// prompt-service/src/__tests__/integration/prompt-repository.integration.test.ts
import { describe, it, expect } from 'vitest';
import { setupIntegrationTests, prisma } from './setup';
import { PromptRepository } from '@/repositories/PromptRepository';
import { createMockPrompt } from 'shared/testing';

describe('Prompt Repository Integration', () => {
  setupIntegrationTests();

  it('creates and retrieves prompt', async () => {
    const repo = new PromptRepository(prisma);
    const input = createMockPrompt();

    const created = await repo.create(input);
    expect(created.id).toBeDefined();

    const retrieved = await repo.findById(created.id);
    expect(retrieved?.name).toBe(input.name);
  });

  it('updates prompt version', async () => {
    const repo = new PromptRepository(prisma);
    const prompt = await repo.create(createMockPrompt());

    const updated = await repo.update(prompt.id, { content: 'Updated content' });
    expect(updated.version).toBe(prompt.version + 1);
  });
});
```

### Deliverables
- [ ] Integration test setup utilities
- [ ] Auth route integration tests
- [ ] Protected route integration tests
- [ ] MSW-based external API tests
- [ ] Database repository tests
- [ ] 35-55 integration tests total

### Validation
```bash
npm run test:integration   # All integration tests pass
```

---

## Phase 4: E2E Tests (Week 7-8)

### Goal
Implement Playwright E2E tests for critical user journeys.

### Tasks

#### 4.1 Create E2E Workspace

```bash
mkdir e2e
cd e2e
npm init -y
```

```json
// e2e/package.json
{
  "name": "@votive/e2e",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.8.3"
  }
}
```

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
    ['json', { outputFile: 'test-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers for CI if needed
  ],

  webServer: process.env.CI ? undefined : {
    command: 'cd .. && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### 4.2 Add E2E Workspace to Root

```json
// root package.json
{
  "workspaces": [
    "shared",
    "backend",
    "app",
    "prompt-service",
    "worker",
    "e2e"
  ],
  "scripts": {
    "test:e2e": "npm run test -w e2e",
    "test:e2e:ui": "npm run test:ui -w e2e"
  }
}
```

#### 4.3 Create Page Objects

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

```typescript
// e2e/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly startAssessmentButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole('heading', { name: /welcome/i });
    this.startAssessmentButton = page.getByRole('button', { name: /start assessment/i });
    this.logoutButton = page.getByRole('button', { name: /logout/i });
  }

  async expectLoaded() {
    await expect(this.welcomeHeading).toBeVisible();
  }
}
```

#### 4.4 Create E2E Tests

```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test('user can login and access dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
    await dashboardPage.expectLoaded();
  });

  test('invalid credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'wrongpassword');

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText(/invalid/i);
    await expect(page).toHaveURL('/login');
  });

  test('user can logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await dashboardPage.expectLoaded();

    // Logout
    await dashboardPage.logoutButton.click();

    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// e2e/tests/assessment.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can complete assessment', async ({ page }) => {
    // Start assessment
    await page.getByRole('button', { name: /start assessment/i }).click();
    await expect(page).toHaveURL(/\/assessment\//);

    // Answer questions (simplified - adjust to your actual UI)
    const questions = page.locator('[data-testid="question"]');
    const questionCount = await questions.count();

    for (let i = 0; i < questionCount; i++) {
      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: /next/i }).click();
    }

    // Submit and verify results
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page).toHaveURL(/\/results\//);
    await expect(page.getByText(/your score/i)).toBeVisible();
  });
});
```

#### 4.5 Create Docker Test Configuration

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
      backend:
        condition: service_healthy
    environment:
      - VITE_API_URL=http://backend:3000

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/data/test.db
      - NODE_ENV=test
      - JWT_SECRET=test-secret-key
    volumes:
      - backend-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 5s
      timeout: 5s
      retries: 5

  prompt-service:
    build:
      context: .
      dockerfile: prompt-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=file:/data/prompts.db
      - NODE_ENV=test
    volumes:
      - prompt-data:/data

volumes:
  backend-data:
  prompt-data:
```

```dockerfile
# e2e/Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY e2e/package*.json ./
RUN npm ci

COPY e2e/ ./

CMD ["npx", "playwright", "test"]
```

#### 4.6 Update CI Pipeline

```yaml
# Add to .github/workflows/ci.yml

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
          path: .
      
      - name: Build and start services
        run: |
          docker compose -f docker-compose.test.yml build
          docker compose -f docker-compose.test.yml up -d
          # Wait for services to be ready
          sleep 30
      
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install E2E dependencies
        working-directory: e2e
        run: |
          npm ci
          npx playwright install --with-deps chromium
      
      - name: Seed test data
        run: |
          docker compose -f docker-compose.test.yml exec -T backend npm run db:seed:test
      
      - name: Run E2E tests
        working-directory: e2e
        run: npx playwright test
        env:
          E2E_BASE_URL: http://localhost:5173
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v6
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report
          retention-days: 7
      
      - name: Stop services
        if: always()
        run: docker compose -f docker-compose.test.yml down -v
```

### Deliverables
- [ ] E2E workspace with Playwright configuration
- [ ] Page Object Models for key pages
- [ ] 5-8 critical E2E tests
- [ ] Docker Compose test configuration
- [ ] Updated CI pipeline with E2E stage
- [ ] Test data seeding for E2E

### Validation
```bash
# Local
npm run test:e2e

# With Docker
docker compose -f docker-compose.test.yml up -d
npm run test:e2e
docker compose -f docker-compose.test.yml down -v
```

---

## Post-Migration Checklist

### Code Quality
- [ ] All tests use shared fixtures (no inline mock data)
- [ ] No `any` types in test files
- [ ] Consistent naming: `*.test.ts` for unit, `*.integration.test.ts` for integration
- [ ] All tests follow AAA pattern (Arrange-Act-Assert)

### CI/CD
- [ ] Unit tests run on every PR
- [ ] Integration tests run on every PR  
- [ ] E2E tests run on main/develop only
- [ ] Coverage reports uploaded to Codecov
- [ ] All quality gates enforced

### Documentation
- [ ] Testing strategy document updated
- [ ] README updated with test commands
- [ ] Contributing guide includes testing requirements

### Monitoring
- [ ] Test execution time tracked (<5 min for unit+integration)
- [ ] Flaky test detection enabled
- [ ] Coverage trends monitored

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test flakiness | High | Proper async handling, avoid timeouts, use retry |
| Slow CI pipeline | Medium | Parallelize unit/integration, E2E only on main |
| Fixture maintenance | Medium | Generate fixtures from schemas where possible |
| Database state bleeding | High | Transaction rollback or clean DB per test |
| External API failures | Medium | MSW for all external calls in tests |

---

## Success Metrics

| Metric | Current | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Total tests | 27 | 80+ | 130+ | 200+ |
| Coverage (avg) | ~60% | 80%+ | 82%+ | 85%+ |
| CI time | ~3 min | ~4 min | ~5 min | ~8 min |
| Flaky rate | Unknown | <2% | <2% | <5% |
| Test pyramid ratio | N/A | 100/0/0 | 75/25/0 | 70/25/5 |

---

## Timeline Summary

| Week | Phase | Key Deliverable |
|------|-------|-----------------|
| 1-2 | Foundation | Shared testing infrastructure |
| 3-4 | Unit Tests | 100+ unit tests, coverage enforced |
| 5-6 | Integration | 50+ integration tests, MSW active |
| 7-8 | E2E | 5-8 E2E tests, full CI pipeline |

**Total effort estimate:** 80-120 hours of development time
