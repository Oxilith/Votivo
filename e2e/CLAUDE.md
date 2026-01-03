# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## E2E Test Workspace

Playwright-based E2E tests for the Votive application. Tests run against Docker Compose services.

**See also**: Root [CLAUDE.md](../CLAUDE.md) for project-wide guidance and [docs/testing-strategy.md](../docs/testing-strategy.md) for full testing philosophy.

## Commands

**IMPORTANT**: All E2E commands must run from the **project root** using dotenvx (not from e2e directory):

```bash
# Run all E2E tests
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Rerun failed tests only
npm run test:e2e:failed

# Run tests matching pattern
npm run test:e2e:grep -- "login"

# View HTML report
npm run test:e2e:report

# Record browser actions to generate test code
npm run test:e2e:codegen

# Run with full trace capture (for debugging failures)
npm run test:e2e:trace

# Run tests serially (debug flaky tests)
npm run test:e2e:serial
```

If a command is missing, add it to both `package.json` (root) and `e2e/package.json` following the dotenvx pattern:
```json
// Root package.json
"test:e2e:newcmd": "npx dotenvx run -f .env.test -- npm run e2e:newcmd -w e2e"

// e2e/package.json
"e2e:newcmd": "playwright test --some-flag"
```

## Prerequisites

Tests require Docker Compose services running with the decryption key:
```bash
# Start services (requires private key for environment decryption)
DOTENV_PRIVATE_KEY=<your-private-key> docker compose up --build
```

## Architecture

```
e2e/
├── __tests__/           # Test files (*.spec.ts)
│   ├── auth/            # Login, logout, register
│   ├── assessment/      # Assessment flow, save, edit, validation
│   ├── insights/        # AI analysis display
│   ├── admin/           # Admin CRUD operations
│   ├── layout/          # Responsive, theme, language
│   ├── error-handling/  # Network failure tests
│   └── i18n/            # Translation coverage
├── pages/               # Page Object Models
│   ├── BasePage.ts      # Common methods, CSRF handling
│   ├── LoginPage.ts     # Auth page interactions
│   ├── AssessmentPage.ts
│   └── ...
├── fixtures/            # Test fixtures
│   ├── index.ts         # Barrel export
│   ├── test.ts          # Extended Playwright fixtures
│   └── mock-data.ts     # Constants (routes, timeouts, responses)
└── playwright.config.ts
```

## Page Object Model

All tests use Page Objects for maintainability. Extend `BasePage` for common functionality:

```typescript
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  async doSomething(): Promise<void> {
    // Use this.page for Playwright interactions
    await this.page.getByTestId('my-element').click();
  }
}
```

**Key BasePage methods:**
- `goto(path)` - Navigate with domcontentloaded wait
- `getCsrfToken()` - Extract CSRF token from cookies
- `isLoggedIn()` - Check for auth state via UI
- `waitForElement(selector, timeout)` - Wait for element visibility
- `screenshot(name)` - Capture for debugging

## Fixtures

Import from `fixtures/index.ts` for all test utilities:

```typescript
import { test, expect, createTestUser } from '../fixtures';
import { E2E_ROUTES, E2E_TIMEOUTS, MOCK_ASSESSMENT_RESPONSES } from '../fixtures';
import { LoginPage, AssessmentPage } from '../pages';
```

**Available fixtures:**
- `loginPage`, `registerPage`, `assessmentPage`, etc. - Pre-configured page objects
- `testUser` - Unique test user generated per test (ensures isolation)
- `authenticatedPage` - Page with pre-registered, logged-in user

**Example:**
```typescript
test('should complete assessment', async ({ authenticatedPage, testUser }) => {
  const assessmentPage = new AssessmentPage(authenticatedPage);
  await assessmentPage.navigate();
  // testUser.email, testUser.password available for assertions
});
```

## Timeouts

Use constants from `mock-data.ts` instead of hardcoded values:

```typescript
import { E2E_TIMEOUTS } from '../fixtures/mock-data';

await element.waitFor({ timeout: E2E_TIMEOUTS.navigation });     // 10s
await page.waitForResponse(url, { timeout: E2E_TIMEOUTS.apiResponse }); // 15s
await element.isVisible({ timeout: E2E_TIMEOUTS.elementQuick }); // 1s
```

## Element Selection

Always use `data-testid` for element selection:

```typescript
// Good
page.getByTestId('submit-button')
page.locator('[data-testid="user-avatar"]')

// Avoid
page.locator('.submit-btn')
page.getByText('Submit')  // Breaks with i18n
```

## Test Isolation

Each test gets:
- Fresh browser context
- Unique test user via `testUser` fixture
- No shared database state between parallel tests

```typescript
test('first test', async ({ testUser }) => {
  // testUser.email = e2e-abc123@test.votive.local
});

test('second test', async ({ testUser }) => {
  // testUser.email = e2e-def456@test.votive.local (different)
});
```

## Configuration

Key settings in `playwright.config.ts`:
- **Base URL**: `https://localhost` (Docker serves on HTTPS)
- **Workers**: 4 locally, 2 in CI
- **Retries**: 0 locally, 2 in CI
- **Timeout**: 60s per test, 10s for assertions
- **Artifacts**: Screenshots/video on failure, trace on first retry

## Writing New Tests

1. Create spec file in appropriate `__tests__/` subdirectory
2. Use existing page objects or create new ones
3. Import fixtures from `../fixtures`
4. Use `E2E_TIMEOUTS` for waits
5. Use `data-testid` for selectors

```typescript
import { test, expect } from '../../fixtures';
import { E2E_TIMEOUTS } from '../../fixtures/mock-data';

test.describe('My Feature', () => {
  test('should do something', async ({ loginPage, testUser }) => {
    await loginPage.navigate();
    // Test implementation
  });
});
```

## CSRF Handling

The app uses double-submit cookie pattern. BasePage provides CSRF helpers:

```typescript
// After login, verify CSRF token is set
const csrfToken = await basePage.getCsrfToken();
expect(csrfToken).toBeTruthy();
```

For authenticated requests, the browser automatically sends the httpOnly cookie.

## Test Data Cleanup Strategy

The E2E test suite uses **stateless per-test isolation**:

### User Isolation
- Each test generates a unique user with UUID-based email: `e2e-{uuid}@test.votive.local`
- No shared users between parallel tests
- Users are created fresh per test, never reused

### Automatic Cleanup
| What | How | When |
|------|-----|------|
| Cookies | `page.context().clearCookies()` | After `authenticatedPage` fixture |
| Browser context | Playwright isolation | Each test file |
| localStorage | `localStorage.clear()` | Explicitly in tests when needed |

### Database Considerations
- Test users accumulate in database (no auto-cleanup)
- Uses `.votive.local` domain to distinguish from real users
- Reset via `npm run db:seed:test` if needed (drops and recreates data with dummy prompt)

### Why No afterEach Hooks?
- Playwright's browser context isolation provides cleanup automatically
- Each test gets a fresh browser context via fixtures
- No shared state between test files or parallel workers
