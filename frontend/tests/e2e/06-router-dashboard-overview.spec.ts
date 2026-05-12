import { test, expect } from './fixtures';

test.describe('Router dashboard + Overview tab', () => {
  test('shows header, tabs, and overview cards', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_over',
      name: 'Overview Router',
      host: '10.0.0.99',
      hostname: 'overview-router.home.',
      model: 'hAP ax3',
      version: '7.13.2',
    });
    await mockOverviewBackend({ id: 'rtr_over', model: 'hAP ax3', version: '7.13.2' });
    await page.goto('/router/rtr_over');

    await expect(page.getByText('Overview Router', { exact: false }).first()).toBeVisible();

    for (const tab of [
      'Overview',
      'Internet',
      'WAN',
      'LAN',
      'WIFI',
      'VPN Server',
      'System',
      'Wizard',
      'Diagnostics',
      'Help',
    ]) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Resources', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Network', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System', exact: true })).toBeVisible();

    await expect(page.getByTestId('overview-hostname')).toHaveText('overview-router.home.');
    await expect(page.getByTestId('overview-model')).toHaveText('hAP ax3');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();
    await expect(page.getByTestId('overview-cpu')).not.toBeEmpty();
  });
});
