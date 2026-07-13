import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — Dual-link', () => {
  test('DHCP domestic + L2TP IP-mask applies', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dual', name: 'Dual Router' });
    await mockEasyConfigBackend({ id: 'rtr_dual' });
    await page.goto('/router/rtr_dual/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /dual-link/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — WAN
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByLabel(/domestic wan/i).click();
    await page.getByRole('option', { name: 'ether2' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — IP-Mask (L2TP)
    await page.getByRole('radio', { name: /^l2tp$/i }).click();
    await page.getByLabel(/^server$/i).fill('l2tp.example.com');
    await page.getByLabel(/^username$/i).fill('road-warrior');
    await page.getByLabel(/^password$/i).fill('warrior-secret');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('Dual-SSID');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — VPN Server (disabled by default) — Apply
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
