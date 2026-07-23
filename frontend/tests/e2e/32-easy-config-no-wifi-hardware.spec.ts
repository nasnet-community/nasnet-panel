import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — router without WiFi hardware', () => {
  test('disables the WiFi step and applies without wireless settings', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_nowifi', name: 'Wired-only Router' });
    await mockEasyConfigBackend({
      id: 'rtr_nowifi',
      interfaces: [
        { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
        { id: '*2', name: 'ether2', type: 'ether', running: true, disabled: false },
      ],
      wifiInterfaces: [],
    });
    await page.goto('/router/rtr_nowifi/config');

    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0`);
    await page.getByRole('button', { name: /^next$/i }).click();

    const wifiToggle = page.getByRole('switch', { name: /wi-fi not available/i });
    await expect(wifiToggle).toBeVisible();
    await expect(wifiToggle).toBeDisabled();
    await expect(wifiToggle).not.toBeChecked();
    await expect(page.getByText(/no wi-fi hardware/i)).toBeVisible();
    await expect(page.getByLabel('Network name (SSID)', { exact: true })).not.toBeVisible();

    await expect(page.getByRole('button', { name: /^next$/i })).toBeEnabled();
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
