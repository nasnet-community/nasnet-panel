import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — multi-band WiFi', () => {
  test('enables 5 GHz alongside default 2.4 GHz and applies', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_mband', name: 'Multi-band Router' });
    await page.goto('/router/rtr_mband/config');

    // Step 1 — Starlink-only
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — Ethernet default, pick interface
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — WireGuard config
    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0`);
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — 2.4 GHz on by default; enable 5 GHz too
    await page.getByLabel(/^2\.4 GHz SSID$/i).fill('NN-24');
    await page.getByLabel(/^2\.4 GHz password$/i).fill('pass24-aa');

    await page.getByRole('switch', { name: /5 GHz/i }).check();
    await page.getByLabel(/^5 GHz SSID$/i).fill('NN-5');
    await page.getByLabel(/^5 GHz password$/i).fill('pass5-bbcd');

    // Toggling 6 GHz on without filling fields disables Next
    await page.getByRole('switch', { name: /6 GHz/i }).check();
    await expect(page.getByRole('button', { name: /^next$/i })).toBeDisabled();

    // Turn 6 GHz back off and proceed
    await page.getByRole('switch', { name: /6 GHz/i }).uncheck();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — Apply
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
