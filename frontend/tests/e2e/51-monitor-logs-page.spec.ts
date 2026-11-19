import { test, expect } from './fixtures';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

test.describe('Monitor logs page', () => {
  test('shows the empty state when the endpoint is missing', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_mon', name: 'Monitor Router', host: '10.10.10.2' });
    await seedCredentials('rtr_mon');
    await context.route('**/api/monitor/logs**', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, message: 'Not Found' }),
      }),
    );
    await page.goto('/router/rtr_mon/monitor-logs');

    await expect(page.getByRole('heading', { name: /^monitor logs$/i })).toBeVisible();
    const stream = page.getByTestId('monitor-log-stream');
    await expect(stream).toContainText('No monitoring events yet.');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('lists events and sends the filters to the server', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_mon', name: 'Monitor Router', host: '10.10.10.2' });
    await seedCredentials('rtr_mon');
    const queries: URLSearchParams[] = [];
    await context.route('**/api/monitor/logs**', async (route) => {
      queries.push(new URL(route.request().url()).searchParams);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          items: [
            {
              id: 'e2',
              time: new Date().toISOString(),
              source: 'wan',
              severity: 'error',
              message: 'WAN link down',
            },
            {
              id: 'e1',
              time: new Date(Date.now() - 60_000).toISOString(),
              source: 'vpn',
              severity: 'info',
              message: 'VPN client connected',
            },
          ],
          total: 2,
          sources: ['vpn', 'wan'],
        }),
      });
    });
    await page.goto('/router/rtr_mon/monitor-logs');

    const stream = page.getByTestId('monitor-log-stream');
    await expect(stream.getByTestId('monitor-log-row')).toHaveCount(2);
    await expect(stream.getByTestId('monitor-log-row').first()).toContainText('WAN link down');

    await page.getByLabel('Search', { exact: true }).fill('link');
    await expect.poll(() => queries.at(-1)?.get('q')).toBe('link');

    await page.getByRole('combobox', { name: 'Time range' }).click();
    await page.getByRole('option', { name: 'Last hour' }).click();
    await expect.poll(() => queries.at(-1)?.has('from')).toBe(true);
  });
});
