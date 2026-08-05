import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — wireless WAN scan', () => {
  test('Starlink wireless picks a network from the scan dialog', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wscan', name: 'Wireless WAN Router' });
    await mockEasyConfigBackend({
      id: 'rtr_wscan',
      scanNetworks: [
        { ssid: 'NasNet-Home', security: 'wpa2-psk', signal: '-45' },
        { ssid: 'Neighbor-WiFi', security: 'wpa2-psk', signal: '-70' },
      ],
    });
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

    // Step 4 — WiFi (last step) — Apply
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('Wireless-Net');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });

  test('scan dedupes SSIDs, search filters the list, and password is optional', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wsearch', name: 'Wireless Search Router' });
    await mockEasyConfigBackend({
      id: 'rtr_wsearch',
      scanNetworks: [
        { ssid: 'NasNet-Home', security: 'wpa2-psk', signal: '-45' },
        { ssid: 'NasNet-Home', security: 'wpa2-psk', signal: '-52' },
        { ssid: 'Neighbor-WiFi', security: 'wpa2-psk', signal: '-70' },
        { ssid: 'Coffee-Guest', security: '', signal: '-60' },
      ],
    });
    await page.goto('/router/rtr_wsearch/config');

    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByRole('radio', { name: 'Wireless' }).first().click();
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'Wifi2.4' }).click();

    await page.getByRole('button', { name: /choose wireless network/i }).click();
    await page.getByRole('combobox', { name: 'Wireless network' }).click();

    // Duplicate SSIDs from the scan collapse to a single entry
    await expect(page.getByRole('option', { name: /NasNet-Home/ })).toHaveCount(1);

    // Typing in the search box narrows the list
    await page.getByLabel('Search options').fill('coffee');
    await expect(page.getByRole('option', { name: /Coffee-Guest/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /NasNet-Home/ })).toHaveCount(0);
    await expect(page.getByRole('option', { name: /Neighbor-WiFi/ })).toHaveCount(0);
    await page.getByRole('option', { name: /Coffee-Guest/ }).click();

    // Connect without entering a password
    await expect(page.getByLabel('Wireless password')).toBeVisible();
    await page.getByRole('button', { name: /verify and connect/i }).click();
    await expect(page.getByText('Coffee-Guest', { exact: true })).toBeVisible();
  });
});
