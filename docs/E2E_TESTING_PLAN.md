# E2E Testing Plan for TrainSmart

## Executive Summary

This document outlines a comprehensive plan for implementing end-to-end (E2E) testing for the TrainSmart platform. Currently, no E2E testing capability exists. We recommend implementing **Playwright** as the E2E testing framework.

**Estimated Effort:** 6-9 days for full implementation

---

## 1. Current Test Setup Analysis

| Category | Status | Details |
|----------|--------|---------|
| **Backend Unit/Integration Tests** | ✅ Yes | 9 test files using pytest with async support (`backend/tests/`) |
| **Frontend Unit Tests** | ⚠️ Configured | Vitest + React Testing Library configured but minimal usage |
| **E2E Tests** | ❌ No | No Cypress, Playwright, or other E2E framework installed |
| **CI/CD** | ✅ Yes | GitHub Actions runs backend tests and frontend lint/build |

**Current Test Stack:**
- **Backend**: pytest, pytest-asyncio, httpx AsyncClient
- **Frontend**: Vitest, @testing-library/react, jsdom (configured but unused)

---

## 2. Framework Recommendation: Playwright

### Why Playwright over Cypress

| Factor | Playwright | Cypress |
|--------|------------|---------|
| **Multi-browser** | Chromium, Firefox, WebKit out of the box | Chrome-family only (Firefox experimental) |
| **Next.js Integration** | Official support via `@playwright/test` | Works, but no official support |
| **Parallel execution** | Native parallelization | Requires Dashboard (paid) |
| **API testing** | Built-in request context | Plugin required |
| **TypeScript** | First-class support | Good support |
| **CI performance** | Generally faster | Slower in CI |
| **Docker support** | Excellent (official images) | Good |

### Playwright Advantages for TrainSmart
- Better for testing sequential activities flow (complex state management)
- Easier to test API + UI together (validate backend state)
- Built-in test fixtures work well with auth flows
- Better debugging with trace viewer

---

## 3. Core User Flows to Test

### Priority 1: Critical Flows (Must Have)

| Flow | Description | Key Files |
|------|-------------|-----------|
| **User Registration** | Signup with invite code, form validation, redirect | `frontend/src/app/(auth)/signup/page.tsx` |
| **User Login** | Email/password auth, JWT handling, role-based redirect | `frontend/src/app/(auth)/login/page.tsx` |
| **MPA Assessment** | Start assessment, answer 36+ questions, view results | `frontend/src/app/(dashboard)/assessment/` |
| **Training Module** | Start module, navigate screens, progress saves correctly | `frontend/src/app/(dashboard)/train/[slug]/` |

### Priority 2: High Value Flows

| Flow | Description |
|------|-------------|
| **Daily Check-ins** | Mood/Energy/Confidence check-in flows |
| **Results Dashboard** | View MPA scores, pillar breakdown, strengths/growth areas |
| **Admin Dashboard** | Invite athletes, view athlete scores, coaching tips |

### Priority 3: Secondary Flows

| Flow | Description |
|------|-------------|
| Journaling | Create/view journal entries |
| Breathing tools | Guided breathing exercise |
| Profile management | View/edit user profile |

---

## 4. Implementation Plan

### Phase 1: Setup and Infrastructure (1-2 days)

**Install Dependencies:**
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

**Create Configuration:**

```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Add Scripts to package.json:**
```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug"
  }
}
```

**Directory Structure:**
```
frontend/
  e2e/
    fixtures/
      auth.fixture.ts      # Authentication helpers
      db.fixture.ts        # Database seeding helpers
    pages/
      login.page.ts        # Page object for login
      assessment.page.ts   # Page object for assessment
      training.page.ts     # Page object for training
    tests/
      auth.spec.ts         # Authentication tests
      assessment.spec.ts   # MPA assessment tests
      training.spec.ts     # Training module tests
      checkin.spec.ts      # Check-in flow tests
      admin.spec.ts        # Admin dashboard tests
    global-setup.ts        # Test database setup
    global-teardown.ts     # Cleanup
```

### Phase 2: Authentication Fixture (0.5 days)

```typescript
// frontend/e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  athleteToken: string;
  adminToken: string;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login via API and set token
    const response = await page.request.post('http://localhost:8000/auth/login', {
      form: { username: 'athlete@test.com', password: 'AthletePass123!' }
    });
    const { access_token } = await response.json();

    // Store token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, access_token);

    await use(page);
  },
});
```

### Phase 3: Core Test Implementation (3-5 days)

**Example: Login Flow**
```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[id="email"]', 'athlete@test.com');
    await page.fill('[id="password"]', 'AthletePass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[id="email"]', 'wrong@test.com');
    await page.fill('[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid email or password');
  });
});
```

**Example: Training Module (Critical - Known Bug Area)**
```typescript
// e2e/tests/training.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Training Module - Sequential Activities', () => {
  test('should unlock Activity 2 after completing Activity 1', async ({ authenticatedPage: page }) => {
    await page.goto('/train/about-performance');
    await page.click('button:has-text("Start Module")');

    // Complete Activity 1 screens
    await completeActivity(page);

    // Return to module overview
    await page.goto('/train/about-performance');

    // Verify Activity 1 is completed
    await expect(page.locator('[data-activity="1"]')).toHaveAttribute('data-status', 'completed');

    // Verify Activity 2 is unlocked
    await expect(page.locator('[data-activity="2"]')).not.toHaveAttribute('data-status', 'locked');
  });
});
```

### Phase 4: Docker Integration (0.5 days)

```yaml
# docker-compose.e2e.yml
version: '3.8'

services:
  db:
    extends:
      file: docker-compose.yml
      service: db

  backend:
    extends:
      file: docker-compose.yml
      service: backend
    environment:
      DATABASE_URL: postgresql+asyncpg://trainsmart:trainsmart_dev@db:5432/trainsmart_test

  frontend:
    extends:
      file: docker-compose.yml
      service: frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000

  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0-jammy
    depends_on:
      - frontend
      - backend
    volumes:
      - ./frontend:/app
    working_dir: /app
    command: npx playwright test
    environment:
      BASE_URL: http://frontend:3000
      API_URL: http://backend:8000
```

### Phase 5: CI/CD Integration (0.5 days)

Add to `.github/workflows/tests.yml`:

```yaml
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: trainsmart_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install and start backend
        working-directory: backend
        run: |
          pip install -r requirements.txt
          alembic upgrade head
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5

      - name: Install frontend and Playwright
        working-directory: frontend
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Build and start frontend
        working-directory: frontend
        run: |
          npm run build
          npm run start &
          sleep 5

      - name: Run E2E tests
        working-directory: frontend
        run: npx playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 5. Effort Estimate

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1: Setup | 1-2 days | Install Playwright, configure, create directory structure |
| Phase 2: Auth Fixture | 0.5 days | Create reusable authentication helpers |
| Phase 3: Core Tests | 3-5 days | Login, Assessment, Training Module, Check-ins, Admin |
| Phase 4: Docker | 0.5 days | E2E-specific docker-compose |
| Phase 5: CI/CD | 0.5 days | GitHub Actions integration |
| **Total** | **6-9 days** | For complete E2E coverage of critical flows |

---

## 6. Recommended Test Order

1. **Login/Logout** - Foundation for all other tests
2. **Training Module with Activity Unlocking** - Catches known bug pattern
3. **MPA Assessment Completion** - Core user flow
4. **Check-in Flow (Mood)** - Simpler flow, good practice
5. **Admin Dashboard** - Different role, validates authorization

---

## 7. Challenges and Mitigations

| Challenge | Mitigation |
|-----------|------------|
| **Test data setup** | Create database seed scripts; use API to create test users |
| **Authentication state** | Use Playwright's `storageState` to persist login |
| **Async operations** | Use Playwright's auto-wait; `waitForResponse` for API calls |
| **Flaky tests** | Use built-in retry mechanism; avoid `sleep()` |
| **CI time** | Run tests in parallel; use test sharding |
| **Test isolation** | Each test creates own data; cleanup in `afterEach` |

---

## 8. Next Steps

When ready to implement:

1. Install Playwright and create configuration
2. Set up authentication fixtures
3. Write first test (Login flow)
4. Write training module test (catches known bug pattern)
5. Integrate with CI/CD
6. Expand to cover all priority flows

---

*Document created: January 2026*
*Status: Planning - Not Yet Implemented*
