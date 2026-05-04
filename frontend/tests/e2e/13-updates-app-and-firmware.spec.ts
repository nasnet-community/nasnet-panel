import { test, expect } from './fixtures';

test.describe('Updates page', () => {
  test('check + install app update flow', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router' });
    await page.goto('/updates');

    await expect(page.getByRole('heading', { name: /app update/i })).toBeVisible();
    await expect(page.getByTestId('app-current-version')).toBeVisible();
    await expect(page.getByTestId('app-latest-version')).toBeVisible();

    await page.getByRole('button', { name: /install app/i }).click();
    await expect(page.getByText(/update complete/i)).toBeVisible();
  });

  test('firmware update flow requires confirmation', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });

    await context.addInitScript((routerId: string) => {
      try {
        const credKey = 'nasnet-panel.session-credentials.v1';
        window.sessionStorage.setItem(
          credKey,
          JSON.stringify({ [routerId]: { username: 'admin', password: 'test' } }),
        );
        const storeKey = 'nasnet-panel.router-store.v1';
        window.localStorage.setItem(
          storeKey,
          JSON.stringify({
            routers: [{ id: routerId, name: 'Update Router', host: '192.168.88.1' }],
            selectedRouterId: null,
            lastConnectedRouterId: routerId,
          }),
        );
      } catch {
        /* ignore */
      }
    }, 'rtr_upd');

    const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

    await context.route('**/api/system/check-for-updates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          channel: 'stable',
          installedVersion: '7.14',
          latestVersion: '7.15',
          status: 'New version is available',
          updateAvailable: true,
        }),
      });
    });

    await context.route('**/api/system/updates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          version: '7.14',
          buildTime: 'Jan/10/2026 15:30:00',
          channel: 'stable',
          updatePolicy: 'manual',
          currentTime: 'Jan/10/2026 16:00:00',
          installTime: '',
          scheduledTime: '',
        }),
      });
    });

    await context.route('**/api/system/install-update', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          success: true,
          message: 'Update started',
          installedVersion: '7.14',
          latestVersion: '7.15',
        }),
      });
    });

    await page.goto('/updates');

    await page.getByRole('button', { name: /install firmware/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(page.getByText(/firmware update started/i)).toBeVisible();
  });
});
