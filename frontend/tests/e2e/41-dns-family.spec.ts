import { test, expect } from './fixtures';

const familySwitch = (page: import('@playwright/test').Page) =>
  page.getByTestId('family-dns-card').getByRole('switch', { name: 'Family DNS' });

test.describe('DNS page (forwarders + Family DNS)', () => {
  test('lists the VPN, foreign and domestic forwarders with their provider', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dns', name: 'DNS Router', host: '10.20.0.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_dns', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_dns' });
    await page.goto('/router/rtr_dns/dns');

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Provider' })).toBeVisible();

    const rows = table.getByRole('row');
    await expect(rows.nth(1)).toContainText('VPN Primary');
    await expect(rows.nth(1)).toContainText('1.0.0.1');
    await expect(rows.nth(1)).toContainText('Cloudflare Secondary');
    await expect(rows.nth(2)).toContainText('VPN Backup 1');
    await expect(rows.nth(2)).toContainText('9.9.9.9');
    await expect(rows.nth(2)).toContainText('Quad9 DNS');
    await expect(rows.nth(3)).toContainText('VPN Backup 2');
    await expect(rows.nth(3)).toContainText('8.8.8.8');
    await expect(rows.nth(3)).toContainText('Google Primary');
    await expect(table).toContainText('Cloudflare Primary');
    await expect(table).toContainText('ICT DNS');
    await expect(table).not.toContainText('VPN-Primary');
  });

  test('shows Family DNS as off and asks for confirmation before enabling it', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_fam', name: 'Family Router', host: '10.20.0.2', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_fam', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_fam' });

    const familyCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/dns/family')) {
        familyCalls.push(req.method());
      }
    });

    await page.goto('/router/rtr_fam/dns');

    const card = page.getByTestId('family-dns-card');
    await expect(card).toContainText('Family DNS');
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is off');

    const toggle = familySwitch(page);
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Enable Family DNS?');
    await expect(dialog).toContainText('OpenDNS FamilyShield');

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(familyCalls).toHaveLength(0);
  });

  test('enables Family DNS with PUT enabled true on the Foreign and all three VPN forwarders', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_ok', name: 'Apply Router', host: '10.20.0.3', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_ok', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_ok' });

    const familyCalls: Array<{ enabled?: boolean }> = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/dns/family')) {
        familyCalls.push(req.postDataJSON() as { enabled?: boolean });
      }
    });

    await page.goto('/router/rtr_ok/dns');

    const table = page.getByRole('table');
    await expect(table).toContainText('1.1.1.1');

    await familySwitch(page).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Enable', exact: true }).click();

    await expect.poll(() => familyCalls.length).toBe(1);
    expect(familyCalls[0]).toEqual({ enabled: true });
    await expect(table).toContainText('1.1.1.3');
    await expect(table).toContainText('1.0.0.3');
    await expect(table).toContainText('208.67.222.123');
    await expect(table).toContainText('208.67.220.123');
    await expect(table).toContainText('Cloudflare Family Primary');
    await expect(table).toContainText('OpenDNS FamilyShield Primary');
    await expect(table).toContainText('OpenDNS FamilyShield Secondary');
    await expect(familySwitch(page)).toBeChecked();
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is on');
  });

  test('turns Family DNS off with PUT enabled false', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_off', name: 'Off Router', host: '10.20.0.5', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_off', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_off', initialFamily: 'on' });

    const offCalls: Array<{ enabled?: boolean }> = [];
    const changeCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/dns/family')) {
        offCalls.push(req.postDataJSON() as { enabled?: boolean });
      }
      if (req.url().includes('/api/dns/change')) changeCalls.push(req.url());
    });

    await page.goto('/router/rtr_off/dns');

    const toggle = familySwitch(page);
    await expect(toggle).toBeChecked();
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is on');

    await toggle.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Disable Family DNS?');
    await dialog.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => offCalls.length).toBe(1);
    expect(offCalls[0]).toEqual({ enabled: false });
    expect(changeCalls).toHaveLength(0);

    const table = page.getByRole('table');
    await expect(table).toContainText('1.1.1.1');
    await expect(table).toContainText('9.9.9.9');
    await expect(table).toContainText('8.8.8.8');
    await expect(table).not.toContainText('208.67.222.123');
    await expect(toggle).not.toBeChecked();
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is off');
  });

  test('reads the Family DNS status from the router on load', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_on', name: 'On Router', host: '10.20.0.6', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_on', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_on', initialFamily: 'on' });

    const statusCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'GET' && req.url().includes('/api/dns/family')) {
        statusCalls.push(req.url());
      }
    });

    await page.goto('/router/rtr_on/dns');

    await expect(familySwitch(page)).toBeChecked();
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is on');
    expect(statusCalls.length).toBeGreaterThan(0);
    await expect(page.getByTestId('dns-family-turn-off')).toHaveCount(0);
  });

  test('reports partial Family DNS and lets the user turn it off', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_part',
      name: 'Partial Router',
      host: '10.20.0.7',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_part', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_part', initialFamily: 'partial' });

    const offCalls: Array<{ enabled?: boolean }> = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/dns/family')) {
        offCalls.push(req.postDataJSON() as { enabled?: boolean });
      }
    });

    await page.goto('/router/rtr_part/dns');

    await expect(familySwitch(page)).not.toBeChecked();
    await expect(page.getByTestId('dns-family-status')).toHaveText(
      'Family DNS is on for some servers only',
    );

    await page.getByTestId('dns-family-turn-off').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Disable Family DNS?');
    await dialog.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => offCalls.length).toBe(1);
    expect(offCalls[0]).toEqual({ enabled: false });
    await expect(page.getByTestId('dns-family-status')).toHaveText('Family DNS is off');
    await expect(page.getByTestId('dns-family-turn-off')).toHaveCount(0);
  });

  test('shows an error when enabling Family DNS fails', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_bad',
      name: 'Failing Router',
      host: '10.20.0.8',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_bad', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_bad', familyStatus: 404 });

    await page.goto('/router/rtr_bad/dns');

    await familySwitch(page).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Enable', exact: true }).click();

    await expect(page.getByText('Failed to enable Family DNS').first()).toBeVisible();
    await expect(familySwitch(page)).not.toBeChecked();
  });
});
