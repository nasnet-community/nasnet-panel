import { test, expect } from './fixtures';

const completedStatus = JSON.stringify({
  status: 200,
  message: 'OK',
  data: { completed: true, progress: 100 },
});

const unauthorized = JSON.stringify({
  status: 401,
  message: 'Authentication failed',
  error: 'invalid or expired token',
});

test.describe('JWT authentication', () => {
  test('logs in once with the router credentials and sends a bearer token afterwards', async ({
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_jwt', name: 'Token Router', host: '10.0.0.95' });
    await seedCredentials('rtr_jwt');
    await mockOverviewBackend({ id: 'rtr_jwt' });

    const logins: Array<{ host?: string; username?: string; password?: string }> = [];
    const apiHeaders: Array<Record<string, string>> = [];
    await context.route('**/api/auth/login', async (route) => {
      logins.push(route.request().postDataJSON() as (typeof logins)[number]);
      await route.fallback();
    });
    await context.route('**/api/config/wizard/status', async (route) => {
      apiHeaders.push(route.request().headers());
      await route.fulfill({ status: 200, contentType: 'application/json', body: completedStatus });
    });

    await page.goto('/router/rtr_jwt');
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toBeVisible();

    expect(logins).toHaveLength(1);
    expect(logins[0]).toEqual({ host: '10.0.0.95', username: 'admin', password: 'test' });
    expect(apiHeaders.length).toBeGreaterThan(0);
    for (const headers of apiHeaders) {
      expect(headers.authorization).toBe('Bearer test-jwt-token.10.0.0.95');
      expect(headers['x-routeros-host']).toBeUndefined();
    }
  });

  test('logs in again and retries when the token is rejected', async ({
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_expired', name: 'Expired Token Router', host: '10.0.0.96' });
    await seedCredentials('rtr_expired');
    await mockOverviewBackend({ id: 'rtr_expired' });

    let loginCount = 0;
    await context.route('**/api/auth/login', async (route) => {
      loginCount += 1;
      await route.fallback();
    });

    let rejected = false;
    await context.route('**/api/config/wizard/status', async (route) => {
      if (!rejected) {
        rejected = true;
        await route.fulfill({ status: 401, contentType: 'application/json', body: unauthorized });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: completedStatus });
    });

    await page.goto('/router/rtr_expired');

    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: /connect to expired token router/i }),
    ).toHaveCount(0);
    expect(loginCount).toBeGreaterThanOrEqual(2);
  });
});
