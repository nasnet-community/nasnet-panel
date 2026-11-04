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

interface MockRelease {
  tag: string;
  prerelease: boolean;
  releaseDate: string;
  releaseUrl: string;
  minRouterosVersion: string;
  minAppVersion: string;
  autoReconfigable: boolean;
  changelog: string[];
}

const release = (
  tag: string,
  changelog: string[] = [],
  extra: Partial<MockRelease> = {},
): MockRelease => ({
  tag,
  prerelease: false,
  releaseDate: '2026-10-29T10:00:00Z',
  releaseUrl: `https://github.com/nasnet-community/nasnet-panel/releases/tag/${tag}`,
  minRouterosVersion: '7.14',
  minAppVersion: '1.0.0',
  autoReconfigable: false,
  changelog,
  ...extra,
});

// Serves the app update endpoints. Each GET of /api/app/update/status returns the next
// entry of `statuses` (null answers with a network error, as while the panel restarts),
// then keeps repeating the last one. /api/app/version reports `runningAfter` once an
// update was started. The first `failedListings` release listings answer with a 502.
async function mockApp(
  context: BrowserContext,
  options: {
    running: string;
    channel: string;
    releases: Record<string, MockRelease[]>;
    statuses?: Array<Record<string, unknown> | null>;
    runningAfter?: string;
    failedListings?: number;
  },
) {
  const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });
  const json = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: envelope(data),
  });
  const channelQueries: string[] = [];
  const updates: unknown[] = [];
  const statuses = options.statuses ?? [{ phase: 'idle' }];
  let polls = 0;

  await context.route('**/api/app/version', (route) =>
    route.fulfill(
      json({
        version: updates.length && options.runningAfter ? options.runningAfter : options.running,
      }),
    ),
  );
  await context.route('**/api/app/update/channel', (route) =>
    route.fulfill(json({ channel: options.channel })),
  );
  await context.route('**/api/app/updates?**', (route) => {
    const channel = new URL(route.request().url()).searchParams.get('channel') ?? '';
    channelQueries.push(channel);
    if (channelQueries.length <= (options.failedListings ?? 0)) {
      return route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 502,
          message: 'Failed to fetch releases from GitHub',
          error: 'Failed to fetch releases from GitHub',
        }),
      });
    }
    return route.fulfill(json(options.releases[channel] ?? []));
  });
  await context.route('**/api/app/update', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() as { version: string };
    updates.push(body);
    await route.fulfill(
      json({ updateAvailable: true, fromVersion: options.running, toVersion: body.version }),
    );
  });
  await context.route('**/api/app/update/status', async (route) => {
    const status = statuses[Math.min(polls, statuses.length - 1)];
    polls += 1;
    if (status === null) {
      await route.abort('connectionrefused');
      return;
    }
    await route.fulfill(json(status));
  });

  return { channelQueries: () => channelQueries, updates: () => updates };
}

test.describe('Updates page', () => {
  test('lists the releases of the saved channel and switches channel', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    const app = await mockApp(context, {
      running: 'v1.0.0',
      channel: 'stable',
      releases: {
        stable: [release('v1.2.0', ['Add static DNS entries']), release('v1.1.0', ['Fix login'])],
        rc: [release('v1.3.0-rc.1', ['Try the new updates page'], { prerelease: true })],
      },
    });

    await page.goto('/updates');

    await expect(page.getByTestId('app-current-version')).toHaveText('v1.0.0');
    const version = page.getByRole('combobox', { name: 'Version' });
    await expect(version).toContainText('v1.2.0');
    await expect(page.getByText('Add static DNS entries')).toBeVisible();

    await version.click();
    await page.getByRole('option', { name: 'v1.1.0' }).click();
    await expect(page.getByText('Fix login')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update to v1.1.0' })).toBeEnabled();

    await page.getByRole('combobox', { name: 'Release channel' }).click();
    await page.getByRole('option', { name: 'Release candidate' }).click();
    await expect(version).toContainText('v1.3.0-rc.1');
    await expect(page.getByText('Pre-release')).toBeVisible();
    expect(app.channelQueries()).toEqual(['stable', 'rc']);
  });

  test('installs the chosen version and reloads once it is running', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    const app = await mockApp(context, {
      running: 'v1.0.0',
      channel: 'stable',
      releases: { stable: [release('v1.2.0'), release('v1.1.0')] },
      statuses: [{ phase: 'pulling' }, null, { phase: 'idle' }],
      runningAfter: 'v1.1.0',
    });

    await page.goto('/updates');
    await page.getByRole('combobox', { name: 'Version' }).click();
    await page.getByRole('option', { name: 'v1.1.0' }).click();
    await page.getByRole('button', { name: 'Update to v1.1.0' }).click();
    await expect(page.getByRole('dialog')).toContainText('v1.1.0');
    await page.getByRole('button', { name: /^confirm$/i }).click();

    await expect(page.getByText('Downloading new version')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText(
      'Update complete',
    );
    expect(app.updates()).toEqual([{ version: 'v1.1.0' }]);
  });

  test('follows the router reconfiguration after the update', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    await mockApp(context, {
      running: 'v1.2.0',
      channel: 'stable',
      releases: { stable: [release('v1.3.0', [], { autoReconfigable: true })] },
      statuses: [
        { phase: 'restarting', reconfig: { state: 'pending', step: '', progress: 0 } },
        { phase: 'idle', reconfig: { state: 'pending', step: '', progress: 0 } },
        {
          phase: 'idle',
          reconfig: { state: 'running', step: 'Configuring WiFi access points', progress: 40 },
        },
        { phase: 'idle', reconfig: { state: 'completed', step: 'Done', progress: 100 } },
      ],
    });

    await page.goto('/updates');
    await page.getByRole('button', { name: 'Update to v1.3.0' }).click();
    await expect(page.getByRole('dialog')).toContainText('reconfigures the router');
    await page.getByRole('button', { name: /^confirm$/i }).click();

    await expect(
      page.getByText('Reconfiguring the router: Configuring WiFi access points'),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Notifications' })).toContainText(
      'Update complete',
    );
  });

  test('blocks releases this router or panel cannot take yet', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    // The firmware mock reports RouterOS 7.14.
    await mockFirmware(context, [{ phase: 'idle' }]);
    await mockApp(context, {
      running: 'v1.0.0',
      channel: 'stable',
      releases: {
        stable: [
          release('v1.4.0', [], { minAppVersion: '1.2.0' }),
          release('v1.1.0', [], { minRouterosVersion: '7.24' }),
        ],
      },
    });

    await page.goto('/updates');
    await expect(page.getByRole('note')).toHaveText(
      'Update to v1.2.0 first, then to this release.',
    );
    await expect(page.getByRole('button', { name: 'Update to v1.4.0' })).toBeDisabled();

    await page.getByRole('combobox', { name: 'Version' }).click();
    await page.getByRole('option', { name: 'v1.1.0' }).click();
    await expect(page.getByRole('note')).toHaveText(
      'Needs RouterOS 7.24 or newer. Update RouterOS first.',
    );
    await expect(page.getByRole('button', { name: 'Update to v1.1.0' })).toBeDisabled();
  });

  test('says when the running version is the latest in the channel', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    // The listing keeps the running release; it is not offered as an update.
    await mockApp(context, {
      running: 'v1.2.0',
      channel: 'stable',
      releases: { stable: [release('v1.2.0')] },
    });

    await page.goto('/updates');
    await expect(page.getByText('Latest Stable release')).toBeVisible();
    await expect(page.getByTestId('app-current-version')).toHaveText('v1.2.0');
    await expect(page.getByRole('button', { name: /update to/i })).toHaveCount(0);
  });

  test('shows a release listing error and retries it', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    const app = await mockApp(context, {
      running: 'v1.0.0',
      channel: 'rc',
      releases: { rc: [release('v1.3.0-rc.1', [], { prerelease: true })] },
      failedListings: 1,
    });

    await page.goto('/updates');
    await expect(page.getByText('Failed to load the releases')).toBeVisible();
    await expect(page.getByRole('button', { name: /update to/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('button', { name: 'Update to v1.3.0-rc.1' })).toBeEnabled();
    await expect(page.getByText('Failed to load the releases')).toHaveCount(0);
    expect(app.channelQueries()).toEqual(['rc', 'rc']);
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

  test('newsletter card subscribes with the UI language', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('nasnet-panel.language', 'fa');
      } catch {
        /* ignore */
      }
    });

    const bodies: unknown[] = [];
    await context.route('https://joinnasnet.com/api/newsletter/panel-subscribe', async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/updates');

    const email = page.getByLabel('نشانی ایمیل');
    await email.fill('not-an-email');
    await page.getByRole('button', { name: 'عضویت' }).click();
    await expect(page.getByRole('alert')).toHaveText('یک نشانی ایمیل معتبر وارد کنید.');
    expect(bodies).toHaveLength(0);

    await email.fill(' User@Example.com ');
    await page.getByRole('button', { name: 'عضویت' }).click();
    await expect(page.getByText('سپاس، نشانی شما به فهرست اضافه شد.')).toBeVisible();
    expect(bodies).toEqual([{ email: 'User@Example.com', locale: 'fa', website: '' }]);
    await expect(page.getByRole('link', { name: 'سیاست حریم خصوصی' })).toHaveAttribute(
      'href',
      'https://joinnasnet.com/fa/privacy/',
    );
  });

  test('newsletter card reports a rate limit and lets the user retry', async ({
    context,
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_upd', name: 'Update Router', host: '192.168.88.1' });
    await mockFirmware(context, [{ phase: 'idle' }]);

    let calls = 0;
    await context.route('https://joinnasnet.com/api/newsletter/panel-subscribe', async (route) => {
      calls += 1;
      await route.fulfill({
        status: calls === 1 ? 429 : 500,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: calls === 1 ? 'rate_limited' : 'server' }),
      });
    });

    await page.goto('/updates');

    await page.getByLabel('Email address').fill('user@example.com');
    const subscribe = page.getByRole('button', { name: 'Subscribe' });
    await subscribe.click();
    await expect(page.getByRole('alert')).toHaveText('Too many attempts. Try again in a minute.');
    await subscribe.click();
    await expect(page.getByRole('alert')).toHaveText('Something went wrong. Please try again.');
    await expect(subscribe).toBeEnabled();
  });
});
