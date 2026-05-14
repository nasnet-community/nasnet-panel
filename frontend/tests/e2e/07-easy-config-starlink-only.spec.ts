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

    // Step 3 — IP-Mask (L2TP tile is default)
    await page.getByLabel(/^server$/i).fill('l2tp.example.com');
    await page.getByLabel(/^username$/i).fill('road-warrior');
    await page.getByLabel(/^password$/i).fill('warrior-secret');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel(/^ssid$/i).fill('Easy-SSID');
    await page.getByLabel(/^password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — VPN Server (disabled by default) — Apply
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
