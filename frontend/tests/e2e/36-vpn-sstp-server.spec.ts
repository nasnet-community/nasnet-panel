import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_sstp';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const SSTP_ENABLED = {
  enabled: true,
  port: 4433,
  protocol: 'tcp',
  localIp: '10.20.0.1',
  localIpPool: 'sstp-local-pool',
  remoteIp: '10.20.0.2-10.20.0.50',
  remoteIpPool: 'sstp-pool',
};

const seedSession = (routerId: string) => {
  try {
    const key = 'nasnet-panel.session-credentials.v1';
    const raw = window.sessionStorage.getItem(key);
    const map = (raw ? JSON.parse(raw) : {}) as Record<
      string,
      { username: string; password: string }
    >;
    map[routerId] = { username: 'admin', password: 'test' };
    window.sessionStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

test.describe('SSTP server', () => {
  test('enables the SSTP server and shows it running once the task completes', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.30' });
    await context.addInitScript(seedSession, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });

    let enabled = false;
    await context.route('**/api/vpn/servers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          ovpnServers: [],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: enabled ? SSTP_ENABLED : null,
        }),
      });
    });

    let postBody: { enabled?: boolean } | null = null;
    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() === 'POST') {
        postBody = route.request().postDataJSON() as typeof postBody;
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: envelope({ taskId: 'sstp-task-1', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    });

    let statusCalls = 0;
    await context.route('**/api/vpn/sstp/server/status/sstp-task-1', async (route) => {
      statusCalls += 1;
      const running = statusCalls < 2;
      if (!running) enabled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          taskId: 'sstp-task-1',
          status: running ? 'running' : 'completed',
          progress: running ? 40 : 100,
          currentStep: running ? 'Issuing server certificate' : 'Done',
          startTime: 0,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'SSTP' })
      .click();

    await dialog.getByRole('button', { name: 'Enable SSTP server' }).click();

    await expect.poll(() => postBody).toEqual({ enabled: true });
    await expect(dialog).toBeHidden();

    const row = page.getByRole('row', { name: /SSTP/ });
    await expect(row).toBeVisible();
    await expect(row.getByText('Running')).toBeVisible();
    await expect(row.getByText('tcp:4433')).toBeVisible();
  });

  test('surfaces the router error when the enable task fails', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.30' });
    await context.addInitScript(seedSession, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/servers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ ovpnServers: [], wireguards: [], pptp: null, l2tp: null, sstp: null }),
      });
    });

    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: envelope({ taskId: 'sstp-task-2', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    });

    await context.route('**/api/vpn/sstp/server/status/sstp-task-2', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          taskId: 'sstp-task-2',
          status: 'error',
          progress: 60,
          currentStep: 'Adding firewall rule',
          startTime: 0,
          error: 'certificate could not be issued',
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'SSTP' })
      .click();
    await dialog.getByRole('button', { name: 'Enable SSTP server' }).click();

    await expect(dialog.getByRole('alert')).toContainText('certificate could not be issued');
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeEnabled();
  });

  test('reports a conflict when the SSTP server is already enabled', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.30' });
    await context.addInitScript(seedSession, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/servers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ ovpnServers: [], wireguards: [], pptp: null, l2tp: null, sstp: null }),
      });
    });

    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ status: 409, message: 'sstp server already enabled' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'SSTP' })
      .click();
    await dialog.getByRole('button', { name: 'Enable SSTP server' }).click();

    await expect(dialog.getByRole('alert')).toContainText(
      'The SSTP server is already enabled on this router.',
    );
    await expect(dialog.getByRole('button', { name: 'Enable SSTP server' })).toBeEnabled();
  });

  test('disables a running SSTP server after confirmation', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.30' });
    await context.addInitScript(seedSession, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });

    let enabled = true;
    await context.route('**/api/vpn/servers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          ovpnServers: [],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: { ...SSTP_ENABLED, enabled },
        }),
      });
    });

    let postBody: { enabled?: boolean } | null = null;
    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() === 'POST') {
        postBody = route.request().postDataJSON() as typeof postBody;
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: envelope({ taskId: 'sstp-task-3', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    });

    await context.route('**/api/vpn/sstp/server/status/sstp-task-3', async (route) => {
      enabled = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          taskId: 'sstp-task-3',
          status: 'completed',
          progress: 100,
          currentStep: 'Done',
          startTime: 0,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: /SSTP/ });
    await expect(row.getByText('Running')).toBeVisible();
    await row.getByRole('button', { name: /disable SSTP/i }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Disable' }).click();

    await expect.poll(() => postBody).toEqual({ enabled: false });
    await expect(page.getByRole('row', { name: /SSTP/ }).getByText('Disabled')).toBeVisible();
    await expect(
      page.getByRole('row', { name: /SSTP/ }).getByRole('button', { name: /disable SSTP/i }),
    ).toHaveCount(0);
  });
});
