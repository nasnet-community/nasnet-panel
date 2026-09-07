import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_dns';

test.describe('DNS page flush cache', () => {
  test('shows the purge cache action in the sidebar', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID });
    await page.goto(`/router/${ROUTER_ID}/dns`);

    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Purge DNS cache' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('clearing the cache reports success', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID });
    await page.goto(`/router/${ROUTER_ID}/dns`);

    await page.getByRole('button', { name: 'Purge DNS cache' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('DNS cache cleared');
  });

  test('a failed flush reports the backend error', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID, flushFails: true });
    await page.goto(`/router/${ROUTER_ID}/dns`);

    await page.getByRole('button', { name: 'Purge DNS cache' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Failed to clear DNS cache');
    await expect(notifications).toContainText('Failed to flush DNS cache');
    await expect(page.getByRole('button', { name: 'Purge DNS cache' })).toBeEnabled();
  });

  test('disables the button until the response arrives', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID });

    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/dns/cache', async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      await pending;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'DNS cache cleared successfully' }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/dns`);

    const button = page.getByRole('button', { name: 'Purge DNS cache' });
    await expect(button).toBeEnabled();
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveText('Purging…');

    release();

    await expect(button).toBeEnabled();
    await expect(button).toHaveText('Purge cache');
  });

  test('keeps the spinner up briefly when the response is instant', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID });
    await page.goto(`/router/${ROUTER_ID}/dns`);

    const button = page.getByRole('button', { name: 'Purge DNS cache' });
    await expect(button).toBeEnabled();

    const startedAt = Date.now();
    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toBeEnabled({ timeout: 5000 });

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(900);
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText(
      'DNS cache cleared',
    );
  });
});
