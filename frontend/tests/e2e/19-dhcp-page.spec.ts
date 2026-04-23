import { test, expect } from './fixtures';

test.describe('DHCP page', () => {
  test('renders servers, leases, and clients loaded from the backend', async ({
    page,
    resetMocks,
    seedRouter,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dhcp', name: 'DHCP Router', host: '10.10.10.1' });
    await mockDhcpBackend({ id: 'rtr_dhcp' });
    await page.goto('/router/rtr_dhcp/dhcp');

    const servers = page.getByTestId('dhcp-servers');
    await expect(servers).toBeVisible();
    await expect(servers).toContainText('default-lan');
    await expect(servers).toContainText('192.168.88.100-192.168.88.200');

    const leases = page.getByTestId('dhcp-leases');
    await expect(leases).toBeVisible();
    await expect(leases).toContainText('192.168.88.101');
    await expect(leases).toContainText('laptop-maj');
    await expect(leases).toContainText('printer');

    const clients = page.getByTestId('dhcp-clients');
    await expect(clients).toBeVisible();
    await expect(clients).toContainText('ether1');
    await expect(clients).toContainText('10.0.0.42');
  });

  test('dashboard tab nav exposes DHCP link', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dhcp2', name: 'DHCP Router 2' });
    await page.goto('/router/rtr_dhcp2');
    await expect(page.getByRole('tab', { name: /dhcp/i })).toBeVisible();
    await page.getByRole('tab', { name: /dhcp/i }).click();
    await expect(page).toHaveURL(/\/router\/rtr_dhcp2\/dhcp$/);
  });
});
