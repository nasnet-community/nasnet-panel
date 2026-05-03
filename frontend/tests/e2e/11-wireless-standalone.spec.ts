import { test, expect } from './fixtures';

test.describe('Wireless standalone', () => {
  test('edit and persist passphrase via edit dialog', async ({
    page,
    resetMocks,
    seedRouter,
    mockWifiBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wire', name: 'Wireless Router' });
    await mockWifiBackend({ id: 'rtr_wire' });
    await page.goto('/router/rtr_wire/wireless');

    await page.getByRole('button', { name: /^edit$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const pw = page.getByLabel('Password', { exact: true });
    await expect(page.getByLabel('SSID')).toBeVisible();
    await pw.fill('newpass123');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/wireless settings saved/i)).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /^edit$/i }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('newpass123');
  });

  test('Bands card aggregates unique bands across interfaces, sorted', async ({
    page,
    resetMocks,
    seedRouter,
    mockWifiBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wire', name: 'Wireless Router' });
    await mockWifiBackend({
      id: 'rtr_wire',
      interfaces: [
        { name: 'wifi1', ssid: 'Net-5g', band: '5ghz-ax', running: true },
        { name: 'wifi2', ssid: 'Net-2g', band: '2ghz-ax', running: true },
        { name: 'wifi3', ssid: 'Net-6g', band: '6ghz-ax', running: true },
      ],
    });
    await page.goto('/router/rtr_wire/wireless');

    await expect(page.getByText('2.4GHZ, 5GHZ, 6GHZ')).toBeVisible();
  });

  test('Bands card shows em-dash when interfaces have no band info', async ({
    page,
    resetMocks,
    seedRouter,
    mockWifiBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wire', name: 'Wireless Router' });
    await mockWifiBackend({
      id: 'rtr_wire',
      interfaces: [
        { name: 'wifi1', ssid: 'Net-1', band: '', running: true },
        { name: 'wifi2', ssid: 'Net-2', band: '', running: true },
      ],
    });
    await page.goto('/router/rtr_wire/wireless');

    const bandsCard = page.getByText('2 interfaces').locator('..');
    await expect(bandsCard).toContainText('—');
    await expect(bandsCard).not.toContainText(/2\.4GHZ|5GHZ|6GHZ/);
  });
});
