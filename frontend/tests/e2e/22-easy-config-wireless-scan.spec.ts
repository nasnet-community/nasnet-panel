import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — wireless WAN scan', () => {
  test('Starlink wireless picks a network from the scan dialog', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wscan', name: 'Wireless WAN Router' });
    await page.goto('/router/rtr_wscan/config');

    // Step 1 — Starlink-only
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — switch Starlink WAN to Wireless
    await page.getByRole('radio', { name: 'Wireless' }).first().click();
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'Wifi2.4' }).click();

    // Open the scan dialog and pick a secured network
    await page.getByRole('button', { name: /choose wireless network/i }).click();
    await page.getByRole('combobox', { name: 'Wireless network' }).click();
    await page
      .getByRole('option', { name: /^NasNet-Home \(/i })
      .first()
      .click();
    await page.getByLabel('Wireless password').fill('supersecret');
    await page.getByRole('button', { name: /verify and connect/i }).click();

    // Selected SSID shows in the green pill on the form
    await expect(page.getByText('NasNet-Home', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — IP-Mask (WireGuard default, fill config and advance)
    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0`);
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — fill 2.4 GHz band (default-on)
    await page.getByLabel(/^2\.4 GHz SSID$/i).fill('Wireless-Net');
    await page.getByLabel(/^2\.4 GHz password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — Apply (vpn server stays disabled)
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
