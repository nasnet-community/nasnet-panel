import { test, expect } from './fixtures';

test.describe('LAN bridge ports', () => {
  test('lists each port with its bridge and behaviour', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge',
      name: 'Bridge Router',
      host: '10.10.10.4',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge' });
    await page.goto('/router/rtr_bridge/lan');

    const card = page.getByTestId('bridge-ports');
    await expect(card).toBeVisible();
    await expect(card).toContainText('ether2');
    await expect(card).toContainText('Split');
    await expect(card).toContainText('Splits traffic to foreign and domestic automatically');
    await expect(card).toContainText('ether4');
    await expect(card).toContainText('Domestic');
    await expect(card).toContainText('Routes all traffic to domestic for that interface');
  });

  test('offers only enabled bridges the port is not already on', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_opts',
      name: 'Bridge Router',
      host: '10.10.10.5',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_opts', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_opts' });
    await page.goto('/router/rtr_bridge_opts/lan');

    const card = page.getByTestId('bridge-ports');
    await card
      .getByRole('button', { name: /^Change bridge for/ })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Change bridge for ether2');
    await expect(dialog).toContainText('may lose the network or the internet for a few seconds');

    await dialog.getByRole('combobox').click();
    const options = page.getByRole('option');
    await expect(options.filter({ hasText: 'Domestic' })).toHaveCount(1);
    await expect(options.filter({ hasText: 'Foreign' })).toHaveCount(1);
    await expect(options.filter({ hasText: 'VPN - wg-client' })).toHaveCount(1);
    // ether2 is already on Split, and the L2TP bridge is disabled.
    await expect(options.filter({ hasText: 'Split' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'L2TP' })).toHaveCount(0);
  });

  test('warns before routing a port to the foreign bridge', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_warn',
      name: 'Bridge Router',
      host: '10.10.10.6',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_warn', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_warn' });
    await page.goto('/router/rtr_bridge_warn/lan');

    await page
      .getByTestId('bridge-ports')
      .getByRole('button', { name: /^Change bridge for/ })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: /^Foreign/ }).click();
    await expect(dialog).toContainText('All traffic on ether2 will be routed to foreign');
  });

  test('changes the bridge and reflects the new membership', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_put',
      name: 'Bridge Router',
      host: '10.10.10.7',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_put', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_put' });

    const updates: Array<{ interface?: string; bridge?: string }> = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().endsWith('/api/interface/bridge/port')) {
        updates.push(req.postDataJSON() as { interface?: string; bridge?: string });
      }
    });

    await page.goto('/router/rtr_bridge_put/lan');

    const card = page.getByTestId('bridge-ports');
    await card
      .getByRole('button', { name: /^Change bridge for/ })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: /VPN - wg-client/ }).click();

    await dialog.getByRole('button', { name: 'Change', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect
      .poll(() => updates)
      .toEqual([{ interface: 'ether2', bridge: 'LANBridgeVPN-wg-client' }]);
    await expect(card).toContainText('VPN - wg-client');
  });

  test('clicking a port on the diagram opens the dialog for that port', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_diag',
      name: 'Bridge Router',
      host: '10.10.10.10',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_diag', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_diag' });
    await page.goto('/router/rtr_bridge_diag/lan');

    await page.getByTestId('bridge-ports').waitFor();
    await page.getByTestId('port-ether4').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Change bridge for ether4');
    await expect(dialog).toContainText('Domestic');
  });

  test('clicking a port that is not on a LAN bridge opens nothing', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_nonlan',
      name: 'Bridge Router',
      host: '10.10.10.11',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_nonlan', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_nonlan' });
    await page.goto('/router/rtr_bridge_nonlan/lan');

    await page.getByTestId('bridge-ports').waitFor();
    await page.getByTestId('port-ether1').click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('cancelling leaves the bridge untouched', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bridge_cancel',
      name: 'Bridge Router',
      host: '10.10.10.8',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bridge_cancel', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_bridge_cancel' });

    const updates: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().endsWith('/api/interface/bridge/port')) {
        updates.push(req.url());
      }
    });

    await page.goto('/router/rtr_bridge_cancel/lan');

    const card = page.getByTestId('bridge-ports');
    await card
      .getByRole('button', { name: /^Change bridge for/ })
      .first()
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(updates).toHaveLength(0);
    await expect(card).toContainText('Split');
  });
});
