import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_ovpn_toggle';
const SERVER_NAME = 'OpenVPN-Server-1779215157';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const ovpnServer = (enabled: boolean) => ({
  name: SERVER_NAME,
  enabled,
  port: 1194,
  protocol: 'tcp',
  localIp: '10.30.0.1',
  localIpPool: 'ovpn-local-pool',
  remoteIp: '10.30.0.2-10.30.0.50',
  remoteIpPool: 'ovpn-pool',
});

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

test.describe('OpenVPN server enable and disable', () => {
  test('enables a disabled OpenVPN server', async ({ page, context, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.40' });
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
          ovpnServers: [ovpnServer(enabled)],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });

    let putBody: { enabled?: boolean } | null = null;
    await context.route(`**/api/vpn/ovpn/server/${SERVER_NAME}`, async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      putBody = route.request().postDataJSON() as typeof putBody;
      enabled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ name: SERVER_NAME, enabled: true }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: new RegExp(SERVER_NAME) });
    await expect(row.getByText('Disabled')).toBeVisible();

    await row.getByRole('button', { name: `Enable ${SERVER_NAME}` }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText('Enable OpenVPN server')).toBeVisible();
    await confirm.getByRole('button', { name: 'Enable', exact: true }).click();

    await expect.poll(() => putBody).toEqual({ enabled: true });
    await expect(page.getByRole('row', { name: new RegExp(SERVER_NAME) })).toContainText('Running');
    await expect(
      page.getByRole('row', { name: new RegExp(SERVER_NAME) }).getByRole('button', {
        name: `Disable ${SERVER_NAME}`,
      }),
    ).toBeVisible();
  });

  test('disables a running OpenVPN server after confirmation', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.40' });
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
          ovpnServers: [ovpnServer(enabled)],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });

    let putBody: { enabled?: boolean } | null = null;
    await context.route(`**/api/vpn/ovpn/server/${SERVER_NAME}`, async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      putBody = route.request().postDataJSON() as typeof putBody;
      enabled = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ name: SERVER_NAME, enabled: false }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: new RegExp(SERVER_NAME) });
    await expect(row.getByText('Running')).toBeVisible();

    await row.getByRole('button', { name: `Disable ${SERVER_NAME}` }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm.getByText('Disable OpenVPN server')).toBeVisible();
    await confirm.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => putBody).toEqual({ enabled: false });
    await expect(page.getByRole('row', { name: new RegExp(SERVER_NAME) })).toContainText(
      'Disabled',
    );
  });

  test('surfaces the router error when disabling fails', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.40' });
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
          ovpnServers: [ovpnServer(true)],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });

    await context.route(`**/api/vpn/ovpn/server/${SERVER_NAME}`, async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ status: 409, message: 'OpenVPN server is already disabled' }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: new RegExp(SERVER_NAME) });
    await row.getByRole('button', { name: `Disable ${SERVER_NAME}` }).click();

    const confirm = page.getByRole('dialog');
    await confirm.getByRole('button', { name: 'Disable', exact: true }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Failed to disable server');
    await expect(notifications).toContainText('OpenVPN server is already disabled');
    await expect(page.getByRole('row', { name: new RegExp(SERVER_NAME) })).toContainText('Running');
  });
});
