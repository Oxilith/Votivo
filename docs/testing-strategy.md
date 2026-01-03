# Votive Testing Strategy

## Philosophy

Follow the Testing Pyramid to maximize confidence while minimizing maintenance cost and execution time. Tests should be deterministic, fast, and provide clear failure signals.

```
           /\
          /  \           E2E (Playwright)
         / 9% \          Slow, expensive, high confidence
        /------\         
       /        \
      /   14%    \       Integration Tests
     /            \      API routes, DB operations, middleware chains
    /--------------\     
   /                \
  /       77%        \   Unit Tests
 /                    \  Fast, isolated, focused
/----------------------\ 
```

## Test Distribution

| Workspace | Unit | Integration | E2E |
|-----------|:----:|:-----------:|:---:|
| app | Yes | - | - |
| backend | Yes | Yes | - |
| prompt-service | Yes | Yes | - |
| worker | Yes | Yes | - |
| shared | Yes | - | - |
| e2e | - | - | Yes |

## File Naming Conventions

| Pattern | Type | Framework | Description |
|---------|------|-----------|-------------|
| `*.test.ts` / `*.test.tsx` | Unit | Vitest | Isolated component/function tests |
| `*.flow.test.ts` | Integration | Vitest + Supertest | API routes, middleware chains, DB operations |
| `*.spec.ts` | E2E | Playwright | Full user journey tests |

## Element Selection Strategy

All tests use `data-testid` attributes for element selection to ensure reliability and maintainability:

```tsx
// Component
<button data-testid="submit-assessment">Submit</button>

// Unit/Integration test (React Testing Library)
screen.getByTestId('submit-assessment')

// E2E test (Playwright)
page.getByTestId('submit-assessment')
```

**Why `data-testid`:**
- **Decoupled from UI text** - Tests don't break when copy changes
- **Decoupled from styling** - Tests don't break when CSS classes change
- **Explicit intent** - Clear which elements are test targets
- **i18n resilient** - Works regardless of language setting
- **Consistent across layers** - Same selectors in unit, integration, and E2E tests

## Architecture

```
votive/
├── shared/
│   ├── src/
│   │   ├── testing/              # Shared test infrastructure
│   │   │   ├── index.ts          # Barrel export
│   │   │   ├── fixtures/         # Factory functions
│   │   │   ├── mocks/            # Reusable mocks
│   │   │   └── utils/            # Test helpers
│   │   └── ...
│   └── __tests__/                # Shared package tests
├── app/
│   └── __tests__/                # Frontend tests
│       └── unit/                 # Component and hook tests
├── backend/
│   └── __tests__/                # Backend tests
│       ├── unit/                 # Service and utility tests
│       └── integration/          # API integration tests
├── prompt-service/
│   └── __tests__/                # Prompt service tests
│       ├── unit/                 # Controller and service tests
│       └── integration/          # Database and auth flow tests
├── worker/
│   └── __tests__/                # Worker tests
│       ├── unit/                 # Job and scheduler tests
│       └── integration/          # Job execution tests
└── e2e/                          # E2E test workspace
    ├── __tests__/                # Playwright tests
    │   ├── auth/                 # Authentication tests
    │   ├── assessment/           # Assessment flow tests
    │   ├── insights/             # AI analysis tests
    │   ├── admin/                # Admin UI tests
    │   ├── layout/               # Layout and responsive tests
    │   └── i18n/                 # Translation coverage tests
    ├── pages/                    # Page Object Models
    ├── fixtures/                 # Test fixtures
    └── playwright.config.ts
```

## Layer 1: Unit Tests (77%)

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
| shared | 80% | 70% | 10% | 80% |
| app | 75% | 75% | 75% | 75% |
| backend | 85% | 85% | 80% | 85% |
| prompt-service | 75% | 75% | 65% | 75% |
| worker | 85% | 85% | 85% | 85% |

## Layer 2: Integration Tests (14%)

### What to Integration Test

- API route handlers with full middleware chain
- Database operations (using test database)
- Authentication/authorization flows
- Cross-service communication
- External API integrations (with MSW)
- CSRF protection flows
- Rate limiting behavior

### Integration Test Pattern

```typescript
// prompt-service/__tests__/integration/auth.flow.test.ts
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

  describe('POST /api/user-auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      // Arrange - create real user in test DB
      const userData = createMockUser();
      await prisma.user.create({ data: userData });

      // Act
      const response = await request
        .post('/api/user-auth/login')
        .send({ email: userData.email, password: 'Password123!' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 for invalid credentials', async () => {
      const response = await request
        .post('/api/user-auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
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

## Layer 3: E2E Tests (9%)

### Test Suites

| Suite | Description |
|-------|-------------|
| `auth/login.spec.ts` | Login form, validation, success/failure |
| `auth/logout.spec.ts` | User logout functionality |
| `auth/register.spec.ts` | User registration flow |
| `assessment/assessment-flow.spec.ts` | Multi-phase navigation, step interactions |
| `assessment/assessment-save.spec.ts` | Saving assessment responses |
| `assessment/assessment-edit.spec.ts` | Editing saved assessments |
| `assessment/assessment-readonly.spec.ts` | Read-only view mode |
| `assessment/assessment-validation.spec.ts` | Form validation |
| `insights/insights-navigation.spec.ts` | AI analysis display, tabs |
| `admin/admin-login.spec.ts` | Admin authentication |
| `admin/prompt-crud.spec.ts` | Prompt CRUD operations |
| `admin/abtest-crud.spec.ts` | A/B test management |
| `admin/prompt-management.spec.ts` | Prompt workflows |
| `layout/layout.spec.ts` | Page layout verification |
| `layout/responsive.spec.ts` | Responsive breakpoints |
| `layout/theme-language.spec.ts` | Theme/language switching |
| `i18n/translation-coverage.spec.ts` | Translation key coverage |

### Playwright Configuration

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,        // Sequential for DB isolation
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                   // One worker for database state
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    ignoreHTTPSErrors: true,   // Self-signed certs in Docker
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  timeout: 60000,
  expect: { timeout: 10000 },
});
```

### Page Object Model

All E2E tests use Page Objects for maintainability:

```typescript
// e2e/pages/BasePage.ts
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getCsrfToken(): Promise<string | null> {
    const cookies = await this.page.context().cookies();
    return cookies.find(c => c.name === 'csrf-token')?.value ?? null;
  }
}

// e2e/pages/LoginPage.ts
export class LoginPage extends BasePage {
  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }
}
```

### Fixtures

```typescript
// e2e/fixtures/test.ts
import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { LoginPage, AssessmentPage, AdminPage } from '../pages';

export const test = base.extend<{
  loginPage: LoginPage;
  assessmentPage: AssessmentPage;
  authenticatedPage: Page;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  authenticatedPage: async ({ page }, use) => {
    // Pre-register and login
    const testUser = {
      email: faker.internet.email(),
      password: 'Password123!',
    };
    // ... registration and login logic
    await use(page);
  },
});
```

## Test Commands

```json
// root package.json scripts
{
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "test:run": "npm run test:run --workspaces --if-present",
    "test:coverage": "npm run test:coverage --workspaces --if-present",
    "test:e2e": "npm run e2e -w e2e",
    "test:e2e:ui": "npm run e2e:ui -w e2e",
    "test:e2e:headed": "npm run e2e:headed -w e2e"
  }
}
```

```json
// workspace package.json scripts (backend example)
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
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
    name: Unit & Integration Tests
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
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v5

  e2e-test:
    name: E2E Tests
    needs: unit-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v6
      - name: Start services
        run: docker compose up -d --wait
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
      - uses: actions/upload-artifact@v6
        if: failure()
        with:
          name: playwright-report
          path: e2e/playwright-report
      - name: Stop services
        if: always()
        run: docker compose down -v
```

## Quality Gates

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| Unit test pass rate | 100% | CI blocks merge |
| Integration test pass rate | 100% | CI blocks merge |
| E2E test pass rate | 100% | CI blocks merge (main/develop only) |
| Coverage (app) | 75% lines | CI blocks merge |
| Coverage (backend) | 85% lines | CI blocks merge |
| Coverage (prompt-service) | 75% lines | CI blocks merge |
| Coverage (worker) | 85% lines | CI blocks merge |
| Coverage (shared) | 80% lines | CI blocks merge |

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
| Fixing tests to match broken code | Destroys knowledge | Fix production code first |

## Key Principles

1. **Tests are documentation** - They show how code should be used
2. **Fast feedback** - Unit tests run in <10s, full suite <5min
3. **Deterministic** - Same input = same output, always
4. **Independent** - Tests can run in any order
5. **DRY infrastructure** - Share fixtures/mocks, not test logic
6. **Test behavior, not implementation** - Refactoring shouldn't break tests
7. **Red tests signal problems** - Investigate before deleting
