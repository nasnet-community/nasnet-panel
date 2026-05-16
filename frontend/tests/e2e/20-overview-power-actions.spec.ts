import { test, expect } from './fixtures';

test.describe('Overview tab — power actions', () => {
  test('reboot confirms, posts to backend, toasts, returns to router list', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_pwr', name: 'Power Router', host: '10.0.0.50' });
    await mockOverviewBackend({ id: 'rtr_pwr' });

    let rebootCalled = false;
    await context.route('**/api/system/reboot', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      rebootCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'System reboot initiated' }),
      });
    });

    await page.goto('/router/rtr_pwr');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await page.getByTestId('diagram-reboot').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /reboot router\?/i })).toBeVisible();
    await dialog.getByRole('button', { name: /^reboot$/i }).click();

    await expect(page.getByText(/reboot initiated/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect(rebootCalled).toBe(true);
  });

  test('shutdown confirms, posts to backend, toasts, returns to router list', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_pwr', name: 'Power Router', host: '10.0.0.50' });
    await mockOverviewBackend({ id: 'rtr_pwr' });

    let shutdownCalled = false;
    await context.route('**/api/system/shutdown', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      shutdownCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'System shutdown initiated' }),
      });
    });

    await page.goto('/router/rtr_pwr');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await page.getByTestId('diagram-shutdown').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /shutdown router\?/i })).toBeVisible();
    await dialog.getByRole('button', { name: /^shutdown$/i }).click();

    await expect(page.getByText(/shutdown initiated/i)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect(shutdownCalled).toBe(true);
  });

  test('cancel keeps the user on the dashboard and does not call backend', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_pwr', name: 'Power Router', host: '10.0.0.50' });
    await mockOverviewBackend({ id: 'rtr_pwr' });

    let called = false;
    await context.route('**/api/system/reboot', async (route) => {
      called = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok' }),
      });
    });

    await page.goto('/router/rtr_pwr');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await page.getByTestId('diagram-reboot').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/router\/rtr_pwr/);
    expect(called).toBe(false);
  });
});
