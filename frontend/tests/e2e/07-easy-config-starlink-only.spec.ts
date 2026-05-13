import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — Starlink-only', () => {
  test('step through all five steps and apply', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_easy', name: 'Easy Router' });
    await page.goto('/router/rtr_easy/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 2 — WAN (Ethernet tile is default)
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 3 — IP-Mask (WireGuard tile is default)
    await page.getByLabel(/endpoint host/i).fill('mask.example.com');
    await page.getByLabel(/endpoint port/i).fill('51820');
    await page.getByLabel(/peer public key/i).fill('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    await page.getByLabel(/allowed ips/i).fill('0.0.0.0/0');
    await page.getByLabel(/keepalive/i).fill('25');
    await page.getByLabel(/mtu/i).fill('1420');
    await page.getByRole('button', { name: /^generate$/i }).click();
    await expect(page.getByLabel(/private key/i)).toHaveValue(/.{43}=/);
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel(/^ssid$/i).fill('Easy-SSID');
    await page.getByLabel(/^password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 5 — VPN Server (disabled by default)
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 6 — Show & Apply
    const script = page.getByTestId('easy-config-script');
    await expect(script).toContainText('/interface/ethernet');
    await expect(script).toContainText('/interface/wireless');
    await expect(script).toContainText('/interface/wireguard');

    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
