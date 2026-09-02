import { test, expect } from './fixtures';

const completedStatus = JSON.stringify({
  status: 200,
  message: 'OK',
  data: { completed: true, progress: 100 },
});

const unauthorized = JSON.stringify({
  status: 401,
  message: 'invalid credentials',
  error: 'invalid user name or password',
});

test.describe('Auth and connectivity error handling', () => {
  test('keeps an unreachable router off the wizard and recovers on retry', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_down', name: 'Silent Router', host: '10.0.0.90' });
    await mockOverviewBackend({ id: 'rtr_down' });

    let reachable = false;
    await context.route('**/api/wizard/status', async (route) => {
      if (!reachable) {
        await route.abort('connectionrefused');
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: completedStatus });
    });

    await page.goto('/router/rtr_down');

    await expect(page.getByRole('heading', { name: 'Router unreachable' })).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_down$/);
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toHaveCount(0);

    reachable = true;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_down$/);
  });

  test('sends the user back to the login prompt when saved credentials are rejected', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_stale', name: 'Stale Router', host: '10.0.0.91' });
    await mockOverviewBackend({ id: 'rtr_stale' });
    await context.route('**/api/wizard/status', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: unauthorized });
    });

    await page.goto('/router/rtr_stale');

    await expect(page.getByRole('dialog', { name: /connect to stale router/i })).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_stale$/);

    const stored = await page.evaluate(() =>
      window.sessionStorage.getItem('nasnet-panel.session-credentials.v1'),
    );
    expect(stored ?? '').not.toContain('rtr_stale');
  });

  test('shows an inline error when the login itself is rejected', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_login', name: 'Login Router', host: '10.0.0.92' });
    await mockOverviewBackend();
    await context.route('**/api/system/info', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: unauthorized });
    });

    await page.goto('/router/rtr_login');

    const dialog = page.getByRole('dialog', { name: /connect to login router/i });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Password', { exact: true }).fill('wrong-pass');
    await dialog.getByRole('button', { name: 'Connect' }).click();

    await expect(dialog.getByText('Invalid username or password')).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_login$/);
  });
});
