# E2E Testing

End-to-end tests verify complete user journeys in a real browser. They sit at the top of the testing pyramid and are used sparingly — only for the most critical workflows where a failure would be catastrophic (router configuration changes, firewall rule management, VPN provisioning).

**Tool:** Playwright
**Project:** `apps/connect-e2e/`
**Config:** `apps/connect-e2e/playwright.config.ts`

---

## Architecture

### Three-Tier Router Testing

E2E tests operate against three router environments:

| Tier | Project name | Test pattern | Router source |
|------|-------------|--------------|---------------|
| 1 — Mock | `chromium`, `firefox`, `webkit` | All `*.spec.ts` | MSW in the running app |
| 2 — CHR Docker | `chr-integration` | `chr-*.spec.ts` | RouterOS CHR Docker container |
| 3 — Physical | Manual only | n/a | Real MikroTik hardware |

For most E2E tests, the frontend runs against its MSW mocks — no real router is needed. CHR (Cloud Hosted Router) tests exercise real RouterOS behavior in CI.

---

## Playwright Configuration

`apps/connect-e2e/playwright.config.ts`

```typescript
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  timeout: 30000,        // 30s per test
  expect: { timeout: 5000 },

  retries: process.env.CI ? 3 : 1,  // 3 retries in CI for transient failures

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',        // Trace when test fails (first retry)
    screenshot: 'only-on-failure',  // Screenshot on failure
    video: 'on-first-retry',        // Video on first retry
    actionTimeout: 10000,           // 10s for each action
    navigationTimeout: 15000,       // 15s for navigation
  },

  // Auto-start the preview server
  webServer: {
    command: 'npx nx run @nas-net/connect:preview',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    // Desktop browsers — all tests
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    // CHR integration — only chr-*.spec.ts files
    {
      name: 'chr-integration',
      testMatch: '**/chr-*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## Writing E2E Tests

### Basic Test Structure

```typescript
// apps/connect-e2e/src/interface-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Interface Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/network');
    await page.waitForLoadState('networkidle');
  });

  test('displays interface list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /interfaces/i })).toBeVisible();
    await expect(page.getByText('ether1')).toBeVisible();
  });

  test('opens interface detail panel', async ({ page }) => {
    await page.getByText('ether1').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ether1' })).toBeVisible();
  });
});
```

### User Action Patterns

```typescript
// Click
await page.getByRole('button', { name: /save/i }).click();

// Type text
await page.getByLabel(/mtu/i).fill('1400');

// Select from dropdown
await page.getByLabel(/filter by type/i).click();
await page.getByRole('option', { name: /ethernet/i }).click();

// Keyboard navigation
await page.keyboard.press('Tab');
await page.keyboard.press('Escape');
await page.keyboard.press('Enter');

// Wait for navigation
await page.waitForLoadState('networkidle');

// Wait for specific element to appear
await expect(page.getByText(/interface updated/i)).toBeVisible({ timeout: 5000 });
```

### Form Validation Tests

```typescript
test('validates MTU range', async ({ page }) => {
  await page.getByText('ether1').click();
  await page.getByRole('tab', { name: /configuration/i }).click();
  await page.getByRole('button', { name: /edit/i }).click();

  // Invalid value — too low
  const mtuInput = page.getByLabel(/mtu/i);
  await mtuInput.fill('50');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText(/must be at least 68/i)).toBeVisible();

  // Invalid value — too high
  await mtuInput.fill('10000');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText(/must be at most 9000/i)).toBeVisible();
});
```

### Confirmation Dialogs

```typescript
test('disables interface with confirmation', async ({ page }) => {
  const enabledInterface = page.locator('[data-status="UP"]').first();
  await enabledInterface.click();

  await page.getByRole('button', { name: /disable/i }).click();

  // Confirm dialog must appear
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByText(/disable.*interface/i)).toBeVisible();

  await page.getByRole('button', { name: /confirm/i }).click();
  await expect(page.getByText(/interface disabled/i)).toBeVisible({ timeout: 5000 });
});
```

### Danger Operations (Countdown Confirm)

For critical operations (disabling a gateway interface), the confirm button is disabled until a countdown completes:

```typescript
test('batch disables with safety warning for gateway', async ({ page }) => {
  await page.locator('[data-gateway="true"]').locator('input[type="checkbox"]').first().check();

  await page.getByRole('button', { name: /batch actions/i }).click();
  await page.getByRole('menuitem', { name: /disable selected/i }).click();

  await expect(page.getByText(/warning.*critical operation/i)).toBeVisible();

  // Countdown button is initially disabled
  const confirmButton = page.getByRole('button', { name: /confirm \(3\)/i });
  await expect(confirmButton).toBeDisabled();

  // Wait for countdown to complete
  await page.waitForTimeout(3000);
  await expect(page.getByRole('button', { name: /confirm disable/i })).toBeEnabled();
});
```

---

## Mobile Testing

Use the `test.use` override within a `test.describe` block to run tests at mobile viewport:

```typescript
test.describe('Interface Management - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('displays mobile card view', async ({ page }) => {
    await page.goto('/dashboard/network');
    await page.waitForLoadState('networkidle');

    // Mobile shows cards, not table
    await expect(page.locator('table')).not.toBeVisible();
    const cards = page.locator('[data-testid="interface-card"]');
    await expect(cards).toHaveCount(await cards.count());
  });

  test('opens full-screen detail on mobile', async ({ page }) => {
    await page.getByText('ether1').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify full-screen (≥ viewport width)
    const box = await dialog.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(375 - 20);
  });
});
```

---

## Accessibility E2E Tests

```typescript
test.describe('Accessibility', () => {
  test('has no axe violations', async ({ page }) => {
    await page.goto('/dashboard/network');
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(() => {
      return window.axe ? window.axe.run() : null;
    });

    if (results) {
      expect(results.violations).toEqual([]);
    }
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('has proper ARIA labels', async ({ page }) => {
    await expect(page.getByRole('table')).toHaveAttribute('aria-label');
    await expect(page.getByRole('search')).toHaveAttribute('aria-label');
  });
});
```

---

## CHR Docker Integration Tests

CHR (Cloud Hosted Router) tests run against a real RouterOS instance in Docker. They are tagged with the `chr-` prefix and run only in the `chr-integration` Playwright project.

### Setting Up CHR

```bash
# Start CHR container
docker-compose -f docker-compose.test.yml up -d

# Wait for container to be healthy (check logs)
docker-compose -f docker-compose.test.yml logs chr-test

# Run only CHR tests
npx playwright test --project=chr-integration
```

### CHR Test Structure

```typescript
// apps/connect-e2e/src/chr-integration.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(() => {
  if (process.env.SKIP_CHR_TESTS) {
    test.skip();
  }
});

test.describe('CHR Docker Integration', () => {
  test('should connect to CHR via web interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // ... real RouterOS interaction
  });
});

test.describe('CHR Health Checks', () => {
  test('should verify CHR container is accessible', async ({ request }) => {
    const chrUrl = process.env.CHR_ROUTER_URL || 'http://localhost:8080';
    const response = await request.get(chrUrl);
    expect([200, 401, 302]).toContain(response.status());
  });
});
```

### CHR Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHR_HOST` | `localhost` | CHR container hostname |
| `CHR_API_PORT` | `8728` | RouterOS API port |
| `CHR_SSH_PORT` | `2222` | SSH port |
| `CHR_HTTP_PORT` | `8080` | HTTP/web interface port |
| `CHR_ROUTER_URL` | `http://localhost:8080` | Full URL for web requests |
| `SKIP_CHR_TESTS` | (unset) | Set to `true` to skip all CHR tests |

### CHR Utilities

`apps/connect/src/test/chr/chr-utils.ts` provides helpers for managing the CHR container lifecycle:

```typescript
import { startCHR, stopCHR, waitForCHR, chrTestHooks } from '@/test/chr/chr-utils';

// In a test file's setup
test.beforeAll(async () => {
  await chrTestHooks.beforeAll(); // Starts CHR, waits for ready
});

test.afterAll(async () => {
  await chrTestHooks.afterAll();
});
```

---

## Available Test Specs

| File | Coverage area |
|------|---------------|
| `interface-management.spec.ts` | Network interface list, detail panel, edit, enable/disable, mobile, accessibility |
| `wan-configuration.spec.ts` | WAN interface setup, DHCP/static/PPPoE |
| `firewall-filter-rules.spec.ts` | Firewall filter rule CRUD |
| `firewall-mangle-rules.spec.ts` | Mangle rule management |
| `firewall-nat-configuration.spec.ts` | NAT/port forwarding |
| `firewall-port-knocking.spec.ts` | Port knocking sequences |
| `firewall-raw-rules.spec.ts` | Raw table rules |
| `firewall-service-ports.spec.ts` | Service port management |
| `firewall-templates.spec.ts` | Firewall template application |
| `address-lists.spec.ts` | Firewall address list management |
| `dns-diagnostics.spec.ts` | DNS lookup tool |
| `troubleshoot-wizard.spec.ts` | Troubleshooting wizard flow |
| `services.spec.ts` | Feature marketplace install/uninstall |
| `storage-management.spec.ts` | Storage configuration |
| `webhook-notifications.spec.ts` | Webhook channel setup |
| `alert-rule-templates.spec.ts` | Alert rule from templates |
| `in-app-notifications.spec.ts` | In-app notification center |
| `quiet-hours.spec.ts` | Notification quiet hours config |
| `rate-limiting.spec.ts` | Rate limiting rules |
| `bridges/bridge-workflow.spec.ts` | Bridge interface creation workflow |
| `chr-integration.spec.ts` | CHR Docker real RouterOS tests |

---

## Running Tests

```bash
# Run all E2E tests (headless, all browsers)
npx nx e2e connect-e2e

# Run with Playwright UI (interactive debugging)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test interface-management

# Run in headed mode (see browser)
npx playwright test --headed

# CHR integration tests only
npx playwright test --project=chr-integration

# Skip CHR tests
SKIP_CHR_TESTS=true npx playwright test
```

---

## CI Integration

In CI (GitHub Actions), Playwright runs:
- All standard tests against Chromium, Firefox, and WebKit
- CHR integration tests if a CHR Docker container is available
- HTML report and JSON results saved as artifacts
- 3 retries for tests that may fail due to network timing
- Screenshots and traces captured on failure

```yaml
# .github/workflows — relevant E2E section
- name: Run E2E tests
  run: npx nx e2e connect-e2e
  env:
    CI: true
    BASE_URL: http://localhost:4200

- name: Upload test artifacts
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-results
    path: apps/connect-e2e/test-results/
```

---

## See Also

- `apps/connect-e2e/playwright.config.ts` — Full configuration
- `apps/connect/src/test/chr/chr-utils.ts` — CHR Docker lifecycle utilities
- `10-testing/mocking.md` — MSW handlers used by the app during E2E
- `09-i18n-accessibility/accessibility.md` — Accessibility test requirements
