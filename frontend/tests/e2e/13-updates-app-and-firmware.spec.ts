import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

type FirmwareStatus = { phase: string; message?: string; toVersion?: string; startedAt?: string };

// Signs in to one router and serves the RouterOS update endpoints. Each GET of
// update-status returns the next entry of `statuses`, then keeps repeating the last.
async function mockFirmware(context: BrowserContext, statuses: FirmwareStatus[]) {
  await context.addInitScript((routerId: string) => {
    try {
      window.sessionStorage.setItem(
        'nasnet-panel.session-credentials.v1',
        JSON.stringify({ [routerId]: { username: 'admin', password: 'test' } }),
      );
      window.localStorage.setItem(
        'nasnet-panel.router-store.v1',
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
  const json = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: envelope(data),
  });

  await context.route('**/api/system/check-for-updates', (route) =>
    route.fulfill(
      json({
        channel: 'stable',
        installedVersion: '7.14',
        latestVersion: '7.15',
        status: 'New version is available',
        updateAvailable: true,
      }),
    ),
  );
  await context.route('**/api/system/updates', (route) =>
    route.fulfill(
      json({
        version: '7.14',
        buildTime: 'Jan/10/2026 15:30:00',
        channel: 'stable',
        updatePolicy: 'manual',
        currentTime: 'Jan/10/2026 16:00:00',
        installTime: '',
        scheduledTime: '',
      }),
    ),
  );

  let installs = 0;
  await context.route('**/api/system/install-update', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    installs += 1;
    await route.fulfill(json({ updateAvailable: true, fromVersion: '7.14', toVersion: '7.15' }));
  });

  let polls = 0;
  await context.route('**/api/system/update-status', async (route) => {
    const status = statuses[Math.min(polls, statuses.length - 1)];
    polls += 1;
    await route.fulfill(json(status));
  });

  return { installs: () => installs };
}

test.describe('Updates page', () => {
  test('check + install app update flow', async ({ context, page, resetMocks, seedRouter }) => {
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

    await context.route('**/api/app/check-for-updates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          appVersion: 'v1.0.0',
          latestVersion: 'v1.1.0',
          releaseDate: '2026-07-01T00:00:00Z',
          releaseUrl: 'https://github.com/nasnet-community/nasnet-panel/releases/tag/v1.1.0',
          updateAvailable: true,
        }),
      });
    });

    await context.route('**/api/app/install-update', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          updateAvailable: true,
          fromVersion: 'v1.0.0',
          toVersion: 'v1.1.0',
        }),
      });
    });

    await context.route('**/api/app/update-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ phase: 'done', message: 'update complete', version: 'v1.1.0' }),
      });
    });

    await context.route('**/api/app/version', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ version: 'v1.1.0' }),
      });
    });

    await page.goto('/updates');

    await expect(page.getByRole('heading', { name: /app update/i })).toBeVisible();
    await expect(page.getByTestId('app-current-version')).toHaveText('v1.0.0');
    await expect(page.getByTestId('app-latest-version')).toHaveText('v1.1.0');

    await page.getByRole('button', { name: /update app/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(page.getByText(/update complete/i)).toBeVisible();
  });

  test('firmware update shows its progress until the router is updated', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    const firmware = await mockFirmware(context, [
      { phase: 'idle' },
      { phase: 'downloading', message: 'Downloading 40%', toVersion: '7.15' },
      { phase: 'rebooting', message: 'waiting for the router to come back', toVersion: '7.15' },
      { phase: 'done', message: 'router updated to 7.15', toVersion: '7.15' },
    ]);

    await page.goto('/updates');

    await page.getByRole('button', { name: /update firmware/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(firmware.installs()).toBe(0);
    await page.getByRole('button', { name: /^confirm$/i }).click();

    await expect(page.getByText('Downloading RouterOS update (40%)')).toBeVisible();
    await expect(page.getByText('Waiting for the router to reboot')).toBeVisible();
    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('RouterOS updated to 7.15');
    await expect(notifications).not.toContainText('failed');
    expect(firmware.installs()).toBe(1);
  });

  test('firmware update reports an error from the router', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [
      { phase: 'idle' },
      { phase: 'downloading', message: 'Downloading 10%' },
      { phase: 'error', message: 'not enough disk space' },
    ]);

    await page.goto('/updates');
    await page.getByRole('button', { name: /update firmware/i }).click();
    await page.getByRole('button', { name: /^confirm$/i }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Firmware update failed');
    await expect(notifications).toContainText('not enough disk space');
    await expect(page.getByRole('button', { name: /update firmware/i })).toBeEnabled();
  });

  test('a running firmware update is picked up when the page opens', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    const firmware = await mockFirmware(context, [
      { phase: 'rebooting', toVersion: '7.15', startedAt: new Date().toISOString() },
    ]);

    await page.goto('/updates');

    await expect(page.getByText('Waiting for the router to reboot')).toBeVisible();
    await expect(page.getByRole('button', { name: /installing/i })).toBeDisabled();
    expect(firmware.installs()).toBe(0);
  });
});
