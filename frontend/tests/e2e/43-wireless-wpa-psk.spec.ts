import { test, expect } from './fixtures';

test.describe('Wireless WPA-PSK security', () => {
  test('selecting WPA-PSK in edit dialog sends it on save', async ({
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
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const wpa = dialog.getByLabel('WPA-PSK', { exact: true });
    await expect(wpa).not.toBeChecked();
    await wpa.check();
    await expect(wpa).toBeChecked();
    await expect(dialog.getByLabel('WPA2-PSK', { exact: true })).toBeChecked();

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/wifi/settings/') && req.method() === 'PUT',
    );
    await dialog.getByRole('button', { name: /^save$/i }).click();
    const request = await requestPromise;
    const body = request.postDataJSON() as { securityTypes?: string };
    expect(body.securityTypes?.split(',').sort()).toEqual(['wpa-psk', 'wpa2-psk']);

    await expect(page.getByText(/wireless settings saved/i)).toBeVisible();
  });
});
