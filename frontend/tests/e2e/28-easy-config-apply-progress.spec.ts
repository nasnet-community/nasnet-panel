import { test, expect } from './fixtures';

async function stepToApply(page: import('@playwright/test').Page) {
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

  await page.getByLabel('Network name (SSID)', { exact: true }).fill('Progress-Net');
  await page.getByLabel('Wi-Fi password', { exact: true }).fill('longpassword');
  await page.getByRole('button', { name: /^next$/i }).click();

  await page.getByRole('button', { name: /^apply$/i }).click();
}

test.describe('Easy-Mode wizard — apply progress', () => {
  test('reports router progress while applying, then reports success', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_progress', name: 'Progress Router' });
    await mockEasyConfigBackend({
      id: 'rtr_progress',
      wifiInterfaces: [{ id: '*100', name: 'wifi1', band: '2ghz-ax' }],
      wizardProgress: [5, 45, 100],
    });
    await page.goto('/router/rtr_progress/config');

    await stepToApply(page);

    const bar = page.getByRole('progressbar', { name: /progress/i });
    await expect(bar).toBeVisible();

    // the bar tracks the values the router reports, rather than jumping straight to done
    await expect(bar).toHaveAttribute('aria-valuenow', '45');

    await expect(page.getByText(/configuration applied/i).first()).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  });

  test('keeps polling when the router drops off mid-apply', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_flaky', name: 'Flaky Router' });
    await mockEasyConfigBackend({
      id: 'rtr_flaky',
      wifiInterfaces: [{ id: '*100', name: 'wifi1', band: '2ghz-ax' }],
    });

    // the wizard rewrites the router's addressing, so the first status polls fail outright
    let polls = 0;
    await context.route('**/api/wizard/status', async (route) => {
      polls += 1;
      if (polls <= 2) return route.abort('connectionrefused');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'OK',
          data: { completed: true, completedAt: null, progress: 100 },
        }),
      });
    });

    await page.goto('/router/rtr_flaky/config');
    await stepToApply(page);

    await expect(page.getByText(/configuration applied/i).first()).toBeVisible({ timeout: 15000 });
  });
});
