import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — Starlink-only', () => {
  test('step through all five steps and apply', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_easy', name: 'Easy Router' });
    await page.goto('/router/rtr_easy/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /starlink-only/i }).check();
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

    // Step 4 — WiFi
    await page.getByLabel(/^2\.4 GHz SSID$/i).fill('Easy-SSID');
    await page.getByLabel(/^2\.4 GHz password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — VPN Server (disabled by default) — Apply
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
