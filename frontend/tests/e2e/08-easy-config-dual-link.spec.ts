import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — Dual-link', () => {
  test('PPPoE domestic + L2TP IP-mask applies', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dual', name: 'Dual Router' });
    await page.goto('/router/rtr_dual/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /dual-link/i }).check();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 2 — WAN
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByLabel(/domestic wan/i).click();
    await page.getByRole('option', { name: 'ether2' }).click();
    await page.getByRole('radio', { name: /pppoe/i }).check();
    await page.getByLabel(/pppoe username/i).fill('user@isp');
    await page.getByLabel(/pppoe password/i).fill('secret');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 3 — IP-Mask (L2TP)
    await page.getByRole('radio', { name: /^l2tp$/i }).click();
    await page.getByLabel(/^server$/i).fill('l2tp.example.com');
    await page.getByLabel(/^username$/i).fill('road-warrior');
    await page.getByLabel(/^password$/i).fill('warrior-secret');
    await page.getByLabel(/ipsec secret/i).fill('shared-key');
    await page.getByLabel(/^profile$/i).fill('default-encryption');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel(/^ssid$/i).fill('Dual-SSID');
    await page.getByLabel(/^password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 5 — VPN Server (disabled by default)
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 6 — Show & Apply
    const script = page.getByTestId('easy-config-script');
    await expect(script).toContainText('/ppp/profile');
    await expect(script).toContainText('/interface/l2tp-client');

    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
