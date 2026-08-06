import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — multi-band WiFi', () => {
  test('offers the split toggle off by default, suffixes band names when enabled, and applies', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_mband', name: 'Multi-band Router' });
    await mockEasyConfigBackend({
      id: 'rtr_mband',
      interfaces: [
        { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
        { id: '*2', name: 'ether2', type: 'ether', running: true, disabled: false },
        { id: '*3', name: 'wifi1', type: 'wifi', running: true, disabled: false },
        { id: '*4', name: 'wifi2', type: 'wifi', running: true, disabled: false },
        { id: '*5', name: 'wifi3', type: 'wifi', running: true, disabled: false },
      ],
      wifiInterfaces: [
        { id: '*100', name: 'wifi1', band: '2ghz-ax' },
        { id: '*101', name: 'wifi2', band: '5ghz-ax' },
        { id: '*102', name: 'wifi3', band: '6ghz-ax' },
      ],
    });
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

    // Step 4 — the router reports three radios, so the split toggle is offered, off by default
    const splitToggle = page.getByRole('switch', { name: /split across bands/i });
    await expect(splitToggle).toBeVisible();
    await expect(splitToggle).not.toBeChecked();

    // A single SSID and password cover every band
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('NN-Home');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');

    // An empty SSID blocks Apply
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('');
    await expect(page.getByRole('button', { name: /^apply$/i })).toBeDisabled();
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('NN-Home');

    await splitToggle.check();
    await expect(splitToggle).toBeChecked();
    await expect(page.getByText('NN-Home-2.4')).toBeVisible();
    await expect(page.getByText('NN-Home-5', { exact: true })).toBeVisible();
    await expect(page.getByText('NN-Home-6', { exact: true })).toBeVisible();

    // Splitting can be turned off to keep the network on a single band
    await splitToggle.uncheck();
    await expect(splitToggle).not.toBeChecked();

    // WiFi is the last step in Starlink-only — Apply
    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });

  test('hides the split toggle when the router has a single radio', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_single', name: 'Single-band Router' });
    await mockEasyConfigBackend({
      id: 'rtr_single',
      interfaces: [
        { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
        { id: '*2', name: 'ether2', type: 'ether', running: true, disabled: false },
        { id: '*3', name: 'wifi1', type: 'wifi', running: true, disabled: false },
      ],
      wifiInterfaces: [{ id: '*100', name: 'wifi1', band: '2ghz-ax' }],
    });
    await page.goto('/router/rtr_single/config');

    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0`);
    await page.getByRole('button', { name: /^next$/i }).click();

    await expect(page.getByLabel('Network name (SSID)', { exact: true })).toBeVisible();
    await expect(page.getByRole('switch', { name: /split across bands/i })).toHaveCount(0);
  });
});
