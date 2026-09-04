import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — VPN server step', () => {
  test('configures WireGuard server with first user', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_vpn', name: 'VPN Router' });
    await mockEasyConfigBackend({ id: 'rtr_vpn' });
    await page.goto('/router/rtr_vpn/config');

    // Step 1 — Choose (dual-link keeps the VPN Server step)
    await page.getByRole('radio', { name: /dual-link/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 2 — WAN
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByLabel(/domestic wan/i).click();
    await page.getByRole('option', { name: 'ether2' }).click();
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 3 — IP-Mask (WireGuard is default)
    await page.getByLabel(/wireguard configuration/i).fill(`[Interface]
PrivateKey = 4AjT3jhk6L8h3GVe7Mw3lP3xQK4n5cL2yR6f8tWvX1c=
Address = 10.0.0.2/32

[Peer]
PublicKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Endpoint = mask.example.com:51820
AllowedIPs = 0.0.0.0/0`);
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel('Network name (SSID)', { exact: true }).fill('SrvNet');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    // Step 5 — VPN Server
    await page.getByRole('switch', { name: /enabled|disabled/i }).check();
    await page.getByLabel(/certificate passphrase/i).fill('super-secret');
    await page.getByLabel(/^username$/i).fill('alice');

    const password = page.getByLabel(/^password$/i);
    const apply = page.getByRole('button', { name: /^apply$/i });

    // a password shorter than 8 characters blocks the step
    await password.fill('short12');
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(apply).toBeDisabled();

    await password.fill('alice-pass');
    await expect(page.getByText('Password must be at least 8 characters.')).toBeHidden();

    // Apply from the VPN Server step (last step)
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
  });
});
