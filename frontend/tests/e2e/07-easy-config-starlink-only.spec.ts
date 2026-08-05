import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — Starlink-only', () => {
  test('step through all four steps and apply', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_easy', name: 'Easy Router' });
    await mockEasyConfigBackend({ id: 'rtr_easy' });
    await page.goto('/router/rtr_easy/config');

    // Step 1 — Choose (Starlink-only drops the VPN Server step)
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await expect(
      page.getByRole('list', { name: 'Wizard progress' }).getByText('VPN Server'),
    ).toHaveCount(0);
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — WAN (Ethernet tile is default)
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — IP-Mask (WireGuard is default)
    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`);
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — WiFi (last step) — Apply
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('Easy-SSID');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
