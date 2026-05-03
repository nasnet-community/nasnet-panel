import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_vpn';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const baseClient = {
  id: '*1',
  name: 'home-l2tp',
  type: 'l2tp-out',
  running: false,
  disabled: true,
  mtu: 1450,
  macAddress: '',
  rxByte: 0,
  txByte: 0,
  rxPacket: 0,
  txPacket: 0,
  lastLinkUp: '',
  lastLinkDown: '',
  linkDowns: 0,
};

test.describe('VPN clients tab', () => {
  test('lists clients from backend and toggles enable via PUT', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'VPN Router', host: '10.0.0.10' });

    await context.addInitScript((routerId) => {
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
    }, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([baseClient]),
        });
        return;
      }
      await route.fallback();
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
          sstp: null,
        }),
      });
    });

    let lastPutBody: { disabled?: boolean; comment?: string } | null = null;
    await context.route('**/api/vpn/clients/home-l2tp', async (route) => {
      if (route.request().method() === 'PUT') {
        lastPutBody = route.request().postDataJSON() as typeof lastPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ ...baseClient, disabled: false }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: /home-l2tp/ });
    await expect(row).toBeVisible();
    await expect(row.getByText('L2TP', { exact: true })).toBeVisible();

    await row.getByRole('switch', { name: /enabled/i }).click();
    await expect.poll(() => lastPutBody?.disabled).toBe(false);
  });

  test('validates name and host inputs in add dialog and limits selectable types', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'VPN Router', host: '10.0.0.10' });

    await context.addInitScript((routerId) => {
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
    }, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
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
          sstp: null,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add client' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox', { name: 'VPN type' }).click();
    await expect(page.getByRole('option', { name: 'L2TP' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'OpenVPN' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.getByRole('option', { name: 'WireGuard' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await page.getByRole('option', { name: 'L2TP' }).click();

    const submit = dialog.getByRole('button', { name: 'Add client' });
    await expect(submit).toBeDisabled();

    const name = dialog.getByLabel('Name');
    await name.fill('bad name');
    await name.blur();
    await expect(
      dialog.getByText('Use letters, digits, hyphens or underscores only.'),
    ).toBeVisible();
    await name.fill('home-l2tp');

    const connect = dialog.getByLabel('Connect to');
    await connect.fill('not a host');
    await connect.blur();
    await expect(dialog.getByText('Enter a valid IP address or hostname.')).toBeVisible();
    await connect.fill('192.168.1.1');

    await dialog.getByLabel('User').fill('alice');
    await dialog.getByLabel('Password', { exact: true }).fill('s3cret');

    await expect(submit).toBeEnabled();
  });

  test('submits L2TP client via POST and refreshes the list', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'VPN Router', host: '10.0.0.10' });

    await context.addInitScript((routerId) => {
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
    }, ROUTER_ID);

    let listCalls = 0;
    await context.route('**/api/vpn/clients', async (route) => {
      listCalls += 1;
      const body = listCalls === 1 ? [] : [{ ...baseClient, disabled: false }];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(body),
      });
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
          sstp: null,
        }),
      });
    });

    let lastPostBody: {
      name?: string;
      connectTo?: string;
      user?: string;
      password?: string;
      ipsecSecret?: string;
      disabled?: boolean;
    } | null = null;
    await context.route('**/api/vpn/l2tp-client', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      lastPostBody = route.request().postDataJSON() as typeof lastPostBody;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: envelope({ ...baseClient, disabled: false }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add client' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name').fill('home-l2tp');
    await dialog.getByLabel('Connect to').fill('vpn.example.com');
    await dialog.getByLabel('User').fill('alice');
    await dialog.getByLabel('Password', { exact: true }).fill('s3cret');

    const ipsecSecret = dialog.getByLabel('IPsec secret');
    await expect(ipsecSecret).toBeDisabled();
    await dialog.getByRole('switch', { name: 'Use IPsec' }).check();
    await expect(ipsecSecret).toBeEnabled();
    await ipsecSecret.fill('topsecret');
    await dialog.getByRole('button', { name: 'Add client' }).click();

    await expect.poll(() => lastPostBody?.name).toBe('home-l2tp');
    expect(lastPostBody).toMatchObject({
      name: 'home-l2tp',
      connectTo: 'vpn.example.com',
      user: 'alice',
      password: 's3cret',
      ipsecSecret: 'topsecret',
      disabled: false,
    });

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('row', { name: /home-l2tp/ })).toBeVisible();
  });

  test('renders empty-state icon when no clients are configured', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'VPN Router', host: '10.0.0.10' });

    await context.addInitScript((routerId) => {
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
    }, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
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
          sstp: null,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await expect(page.getByText('No VPN clients yet.')).toBeVisible();
    await expect(page.getByText('No VPN servers configured.')).toBeVisible();
  });
});
