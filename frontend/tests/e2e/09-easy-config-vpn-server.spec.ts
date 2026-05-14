import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — VPN server step', () => {
  test('configures WireGuard server with first user', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_vpn', name: 'VPN Router' });
    await page.goto('/router/rtr_vpn/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — WAN
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — IP-Mask (L2TP default)
    await page.getByLabel(/^server$/i).fill('l2tp.example.com');
    await page.getByLabel(/^username$/i).fill('road-warrior');
    await page.getByLabel(/^password$/i).fill('warrior-secret');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel(/^ssid$/i).fill('SrvNet');
    await page.getByLabel(/^password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — VPN Server
    await page.getByRole('switch', { name: /enabled|disabled/i }).check();
    await page.getByLabel(/certificate passphrase/i).fill('super-secret');
    await page.getByLabel(/^username$/i).fill('alice');
    await page.getByLabel(/^password$/i).fill('alice-pass');

    // Apply from the VPN Server step (last step)
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
