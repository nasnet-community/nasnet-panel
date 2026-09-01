import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_sstp_enabled';

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

test.describe('SSTP already enabled', () => {
  test('blocks enabling SSTP again when the server is already running', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.31' });
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
        body: envelope({
          ovpnServers: [],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: SSTP_ENABLED,
        }),
      });
    });

    let posted = false;
    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: envelope({ taskId: 'sstp-task-blocked', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'SSTP' })
      .click();

    const action = dialog.getByRole('button', { name: 'SSTP server already enabled' });
    await expect(action).toBeVisible();
    await expect(action).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Enable SSTP server' })).toHaveCount(0);
    await expect(dialog).toContainText('The SSTP server is already enabled on this router.');

    await expect(action).toHaveAccessibleDescription(
      /The SSTP server is already enabled on this router\./,
    );

    expect(posted).toBe(false);
  });

  test('offers the enable action when SSTP is not enabled yet', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.31' });
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
        body: envelope({
          ovpnServers: [],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: { ...SSTP_ENABLED, enabled: false },
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

    await expect(dialog.getByRole('button', { name: 'Enable SSTP server' })).toBeEnabled();
    await expect(dialog).toContainText('Enabling SSTP issues a server certificate');
  });
});
