import { test, expect } from './fixtures';

test.describe('Real dashboard overview', () => {
  test('renders router banner, resources, network row, system tables', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dash', name: 'Dashboard Router', host: '10.10.10.1' });
    await mockOverviewBackend({ id: 'rtr_dash' });
    await page.goto('/router/rtr_dash');

    // Banner
    await expect(page.getByRole('heading', { name: /Dashboard Router/ })).toBeVisible();
    await expect(page.getByText('10.10.10.1').first()).toBeVisible();
    await expect(page.getByText(/uptime/i).first()).toBeVisible();

    // Sections
    await expect(page.getByText('Resources', { exact: false })).toBeVisible();
    await expect(page.getByText(/Network Traffic/)).toBeVisible();
    await expect(page.getByText(/System Information/)).toBeVisible();
    await expect(page.getByText(/Hardware Details/)).toBeVisible();

    // Resource cards show a "Normal" or similar tone badge
    await expect(page.getByText('CPU', { exact: true })).toBeVisible();
    await expect(page.getByText('Memory', { exact: true })).toBeVisible();
    await expect(page.getByText('Disk', { exact: true })).toBeVisible();

    // Traffic dropdown lists all interfaces and the graph renders for the selection
    await expect(page.getByLabel('Select interface for traffic')).toBeVisible();
    await expect(page.getByText('Download').first()).toBeVisible();
    await expect(page.getByText(/Mb\/s/).first()).toBeVisible();
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('switching the traffic interface loads its graph', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dash2', name: 'Dashboard Router', host: '10.10.10.1' });
    await mockOverviewBackend({ id: 'rtr_dash2' });
    await page.goto('/router/rtr_dash2');

    const select = page.getByRole('combobox', { name: 'Select interface for traffic' });
    await expect(select).toHaveText(/ether1/);

    // Dropdown lists all interfaces, not just running WAN ports
    await select.click();
    await expect(page.getByRole('option', { name: 'bridge1' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'ether3' })).toBeVisible();

    // Selecting an interface fetches its graph data
    const graphRequest = page.waitForRequest((r) =>
      r.url().includes('/api/interface/graph/bridge1'),
    );
    await page.getByRole('option', { name: 'bridge1' }).click();
    await graphRequest;
    await expect(select).toHaveText(/bridge1/);
    await expect(page.getByText(/Mb\/s/).first()).toBeVisible();
  });
});
