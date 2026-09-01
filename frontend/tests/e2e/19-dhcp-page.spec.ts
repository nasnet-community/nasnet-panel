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

  test('asks for confirmation before making a lease static', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_static',
      name: 'Static Router',
      host: '10.10.10.3',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_static', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_static' });

    const makeStaticCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/dhcp/leases/make-static')) {
        makeStaticCalls.push(req.url());
      }
    });

    await page.goto('/router/rtr_static/lan');

    const leases = page.getByTestId('dhcp-leases');
    await expect(leases.getByRole('heading', { name: 'DHCP Leases' })).toBeVisible();

    const makeStaticButton = leases.getByRole('button', {
      name: 'Make static AA:BB:CC:DD:EE:01',
    });

    await makeStaticButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Make DHCP lease static');
    await expect(dialog).toContainText('192.168.88.101');

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(makeStaticCalls).toHaveLength(0);

    await makeStaticButton.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Make static', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => makeStaticCalls.length).toBeGreaterThan(0);
  });
});
