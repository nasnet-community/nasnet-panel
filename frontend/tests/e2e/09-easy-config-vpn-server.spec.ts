import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — VPN server step', () => {
  test('configures WireGuard server with first user', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_vpn', name: 'VPN Router' });
    await page.goto('/router/rtr_vpn/config');

    // Step 1 — Choose
    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 2 — WAN
    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 3 — IP-Mask (WireGuard)
    await page.getByLabel(/endpoint host/i).fill('mask.example.com');
    await page.getByLabel(/endpoint port/i).fill('51820');
    await page.getByLabel(/peer public key/i).fill('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    await page.getByRole('button', { name: /^generate$/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 4 — WiFi
    await page.getByLabel(/^ssid$/i).fill('SrvNet');
    await page.getByLabel(/^password$/i).fill('longpassword');
    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 5 — VPN Server
    await page.getByRole('switch', { name: /enable vpn listener/i }).check();
    await page.getByLabel(/vpn server listen port/i).fill('51821');
    await page.getByLabel(/vpn server ip pool/i).fill('10.9.0.0/24');
    await page.getByLabel(/first user name/i).fill('alice');
    await page
      .getByLabel(/first user public key/i)
      .fill('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=');
    await expect(page.getByRole('link', { name: /manage additional users/i })).toHaveAttribute(
      'href',
      '/router/rtr_vpn/vpn',
    );

    await page.getByRole('button', { name: /^save$/i }).click();

    // Step 6 — Show
    const script = page.getByTestId('easy-config-script');
    await expect(script).toContainText('add name=wg-server listen-port=51821');
    await expect(script).toContainText('add interface=wg-server');
  });
});
