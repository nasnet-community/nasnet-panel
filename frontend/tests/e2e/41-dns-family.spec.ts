import { test, expect } from './fixtures';

test.describe('DNS page (descriptions + Family DNS)', () => {
  test('lists each forwarder with its provider description', async ({
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
    await expect(table).toContainText('ICT DNS');
    await expect(table).toContainText('Cloudflare Primary');
    await expect(table).toContainText('Cloudflare Secondary');
  });

  test('asks for confirmation before enabling Family DNS', async ({
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
      if (req.method() === 'POST' && req.url().includes('/api/dns/family')) {
        familyCalls.push(req.url());
      }
    });

    await page.goto('/router/rtr_fam/dns');

    const card = page.getByTestId('family-dns-card');
    await expect(card).toContainText('Family DNS');

    const toggle = card.getByRole('switch', { name: 'Family DNS' });
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Enable Family DNS?');

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(familyCalls).toHaveLength(0);
  });

  test('applies Cloudflare Family DNS to the Foreign and VPN forwarders', async ({
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

    const familyCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/dns/family')) {
        familyCalls.push(req.url());
      }
    });

    await page.goto('/router/rtr_ok/dns');

    const table = page.getByRole('table');
    await expect(table).toContainText('1.1.1.1');

    await page.getByTestId('family-dns-card').getByRole('switch', { name: 'Family DNS' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Enable', exact: true }).click();

    await expect.poll(() => familyCalls.length).toBeGreaterThan(0);
    await expect(table).toContainText('1.1.1.3');
    await expect(table).toContainText('1.0.0.3');
    await expect(table).toContainText('Cloudflare Family Primary');
    await expect(
      page.getByTestId('family-dns-card').getByRole('switch', { name: 'Family DNS' }),
    ).toBeChecked();
  });

  test('turns Family DNS back off from the toggle', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_off', name: 'Off Router', host: '10.20.0.5', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_off', model: 'hAP ax3' });
    await mockDnsBackend({ id: 'rtr_off' });

    const changeCalls: Array<{ oldIp?: string; newIp?: string }> = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/dns/change')) {
        changeCalls.push(req.postDataJSON() as { oldIp?: string; newIp?: string });
      }
    });

    await page.goto('/router/rtr_off/dns');

    const toggle = page.getByTestId('family-dns-card').getByRole('switch', { name: 'Family DNS' });
    await toggle.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Enable', exact: true }).click();
    await expect(toggle).toBeChecked();

    await toggle.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Disable Family DNS?');
    await dialog.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => changeCalls.length).toBe(2);
    expect(changeCalls[0]).toEqual({ oldIp: '1.1.1.3', newIp: '1.1.1.1' });
    expect(changeCalls[1]).toEqual({ oldIp: '1.0.0.3', newIp: '1.0.0.1' });
  });
});
