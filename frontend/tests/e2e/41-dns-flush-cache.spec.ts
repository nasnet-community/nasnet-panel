import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_dns';

test.describe('DNS page flush cache', () => {
  test('shows the flush cache action next to the existing header actions', async ({
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
    await expect(page.getByRole('button', { name: 'Flush DNS cache' })).toBeEnabled();
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

    await page.getByRole('button', { name: 'Flush DNS cache' }).click();

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

    await page.getByRole('button', { name: 'Flush DNS cache' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Failed to clear DNS cache');
    await expect(page.getByRole('button', { name: 'Flush DNS cache' })).toBeEnabled();
  });
});
