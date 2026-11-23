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

  test('static domestic WAN sends ip and gateway to finalize', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_dual_static', name: 'Dual Static Router' });
    await mockEasyConfigBackend({ id: 'rtr_dual_static' });
    let finalizeBody: Record<string, unknown> | null = null;
    await page.route('**/api/config/wizard/finalize', async (route) => {
      finalizeBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'OK', data: {} }),
      });
    });
    await page.goto('/router/rtr_dual_static/config');

    await page.getByRole('radio', { name: /dual-link/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByLabel(/starlink wan/i).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByLabel(/domestic wan/i).click();
    await page.getByRole('option', { name: 'ether2' }).click();

    await page
      .getByRole('radiogroup', { name: 'Domestic addressing' })
      .getByRole('radio', { name: /^Static/ })
      .check();
    const ip = page.getByLabel('Domestic static IP');
    await ip.fill('192.168.1.300/24');
    await ip.blur();
    await expect(page.getByText('Enter an IPv4 address')).toBeVisible();
    await expect(page.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await ip.fill('192.168.1.50/24');
    await page.getByLabel('Domestic gateway').fill('192.168.1.254');
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByRole('radio', { name: /^l2tp$/i }).click();
    await page.getByLabel(/^server$/i).fill('l2tp.example.com');
    await page.getByLabel(/^username$/i).fill('road-warrior');
    await page.getByLabel(/^password$/i).fill('warrior-secret');
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByLabel('Network name (SSID)', { exact: true }).fill('Dual-SSID');
    await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByRole('button', { name: /^apply$/i }).click();
    await expect.poll(() => finalizeBody).not.toBeNull();
    expect(finalizeBody).toMatchObject({
      foreign: { interface: 'ether1' },
      domestic: { interface: 'ether2', ip: '192.168.1.50/24', gateway: '192.168.1.254' },
    });
    expect((finalizeBody as unknown as { foreign: Record<string, unknown> }).foreign.ip).toBe(
      undefined,
    );
  });
});
