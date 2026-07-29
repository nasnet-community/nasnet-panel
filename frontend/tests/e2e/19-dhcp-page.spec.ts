import { test, expect } from './fixtures';

test.describe('LAN page (DHCP + port diagram)', () => {
  test('renders leases and clients loaded from the backend', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dhcp', name: 'DHCP Router', host: '10.10.10.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_dhcp', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_dhcp' });
    await page.goto('/router/rtr_dhcp/lan');

    const leases = page.getByTestId('dhcp-leases');
    await expect(leases).toBeVisible();
    await expect(leases).toContainText('192.168.88.101');
    await expect(leases).toContainText('laptop-maj');
    await expect(leases).toContainText('printer');
    await expect(leases).toContainText('Port');
    await expect(leases).toContainText('ether3');

    const clients = page.getByTestId('dhcp-clients');
    await expect(clients).toBeVisible();
    await expect(clients).toContainText('ether1');
    await expect(clients).toContainText('10.0.0.42');
  });

  test('shows the port diagram with live port statuses', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_lan', name: 'LAN Router', host: '10.10.10.2', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_lan', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_lan' });
    await page.goto('/router/rtr_lan/lan');

    await expect(page.getByTestId('lan-ports')).toBeVisible();
    await expect(page.getByTestId('port-diagram')).toBeVisible();
    await expect(page.getByTestId('panel-model')).toHaveText('MikroTik hAP ax3');

    // ether1 has comment "WAN uplink" but is running -> shows its real status, like Overview.
    await expect(page.getByTestId('port-ether1')).toHaveAttribute('data-status', 'up');
    // ether3 is administratively disabled -> greyed.
    await expect(page.getByTestId('port-ether3')).toHaveAttribute('data-status', 'disabled');
    // ether2 is a LAN port -> live, with info exposed via the hover-card tooltip.
    await expect(page.getByTestId('port-ether2')).toHaveAttribute('data-status', 'up');
    await expect(page.getByTestId('port-ether2')).toHaveAttribute('aria-label', /ether2.*up/i);
  });
});
