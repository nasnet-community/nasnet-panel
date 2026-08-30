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

test.describe('WAN VPN clients section', () => {
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

    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
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

    let gatewayPutBody: { gateway?: string } | null = null;
    await context.route('**/api/route/foreign-gateway', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ gateway: null }),
        });
        return;
      }
      if (route.request().method() === 'PUT') {
        gatewayPutBody = route.request().postDataJSON() as typeof gatewayPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ gateway: 'home-l2tp', routesUpdated: 2 }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    const row = page.getByRole('row', { name: /home-l2tp/ });
    await expect(row).toBeVisible();
    await expect(row.getByText('L2TP', { exact: true })).toBeVisible();

    await row.getByRole('switch', { name: /enabled/i }).click();
    await expect.poll(() => lastPutBody?.disabled).toBe(false);
    expect(gatewayPutBody).toBeNull();

    await row.getByRole('button', { name: /set home-l2tp as starlink gateway/i }).click();
    await expect.poll(() => gatewayPutBody?.gateway).toBe('home-l2tp');
    await expect(row.getByText('Gateway', { exact: true })).toBeVisible();
  });

  test('enabling a client leaves others untouched and gateway button points routes at it', async ({
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

    const otherClient = {
      ...baseClient,
      id: '*2',
      name: 'office-wg',
      type: 'wg',
      running: true,
      disabled: false,
    };

    await context.route('**/api/vpn/clients', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope([baseClient, otherClient]),
        });
        return;
      }
      await route.fallback();
    });
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });

    let targetPutBody: { disabled?: boolean } | null = null;
    await context.route('**/api/vpn/clients/home-l2tp', async (route) => {
      if (route.request().method() === 'PUT') {
        targetPutBody = route.request().postDataJSON() as typeof targetPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ ...baseClient, disabled: false }),
        });
        return;
      }
      await route.fallback();
    });

    let otherPutBody: { disabled?: boolean } | null = null;
    await context.route('**/api/vpn/clients/office-wg', async (route) => {
      if (route.request().method() === 'PUT') {
        otherPutBody = route.request().postDataJSON() as typeof otherPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ ...otherClient, disabled: true }),
        });
        return;
      }
      await route.fallback();
    });

    let gatewayPutBody: { gateway?: string } | null = null;
    await context.route('**/api/route/foreign-gateway', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ gateway: 'office-wg' }),
        });
        return;
      }
      if (route.request().method() === 'PUT') {
        gatewayPutBody = route.request().postDataJSON() as typeof gatewayPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ gateway: 'home-l2tp', routesUpdated: 2 }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    const targetRow = page.getByRole('row', { name: /home-l2tp/ });
    const otherRow = page.getByRole('row', { name: /office-wg/ });
    await expect(targetRow).toBeVisible();
    await expect(otherRow.getByRole('switch', { name: /enabled/i })).toBeChecked();
    await expect(otherRow.getByText('Gateway', { exact: true })).toBeVisible();

    await targetRow.getByRole('switch', { name: /enabled/i }).click();

    await expect.poll(() => targetPutBody?.disabled).toBe(false);
    expect(gatewayPutBody).toBeNull();
    expect(otherPutBody).toBeNull();
    await expect(otherRow.getByRole('switch', { name: /enabled/i })).toBeChecked();

    await targetRow.getByRole('button', { name: /set home-l2tp as starlink gateway/i }).click();

    await expect.poll(() => gatewayPutBody?.gateway).toBe('home-l2tp');
    await expect(targetRow.getByText('Gateway', { exact: true })).toBeVisible();
    await expect(otherRow.getByText('Gateway', { exact: true })).toBeHidden();
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
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    await page.getByRole('button', { name: 'New' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const types = dialog.getByRole('radiogroup', { name: 'VPN client type' });
    await expect(types.getByRole('radio', { name: 'L2TP' })).toBeEnabled();
    await expect(types.getByRole('radio', { name: 'WireGuard' })).toBeEnabled();
    await types.getByRole('radio', { name: 'L2TP' }).click();

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

  test('switches form via type tiles and keeps unsupported types disabled', async ({
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
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    await page.getByRole('button', { name: 'New' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const types = dialog.getByRole('radiogroup', { name: 'VPN client type' });
    await expect(types.getByRole('radio')).toHaveCount(4);
    await expect(types.getByRole('radio', { name: 'L2TP' })).toBeChecked();
    await expect(dialog.getByLabel('Connect to')).toBeVisible();

    await types.getByRole('radio', { name: 'WireGuard' }).click();
    await expect(types.getByRole('radio', { name: 'WireGuard' })).toBeChecked();
    await expect(types.getByRole('radio', { name: 'L2TP' })).not.toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Config' })).toBeVisible();
    await expect(dialog.getByLabel('Connect to')).toHaveCount(0);

    const openvpn = types.getByRole('radio', { name: 'OpenVPN' });
    const sstp = types.getByRole('radio', { name: 'SSTP' });
    await expect(openvpn).toBeDisabled();
    await expect(sstp).toBeDisabled();
    await expect(openvpn).not.toBeChecked();
    await expect(sstp).not.toBeChecked();

    await openvpn.click({ force: true });
    await expect(types.getByRole('radio', { name: 'WireGuard' })).toBeChecked();
    await expect(dialog.getByRole('textbox', { name: 'Config' })).toBeVisible();
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
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
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
    await context.route('**/api/vpn/l2tp/client', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      lastPostBody = route.request().postDataJSON() as typeof lastPostBody;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: envelope({ ...baseClient, disabled: false }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    await page.getByRole('button', { name: 'New' }).click();
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

  test('edits L2TP client via PUT after prefilling from GET endpoint', async ({
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
        body: envelope([{ ...baseClient, disabled: false }]),
      });
    });
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });

    await context.route('**/api/vpn/l2tp/client/home-l2tp', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            id: '*1',
            name: 'home-l2tp',
            disabled: false,
            running: false,
            connectTo: 'vpn.old.example.com',
            user: 'alice',
            password: 'oldpass',
            profile: 'default',
            useIPsec: true,
            ipsecSecret: 'oldsecret',
            comment: '',
          }),
        });
        return;
      }
      await route.fallback();
    });

    let lastPutBody: {
      connectTo?: string;
      user?: string;
      password?: string;
      disabled?: boolean;
      ipsecSecret?: string;
    } | null = null;
    await context.route('**/api/vpn/l2tp/client/*1', async (route) => {
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

    await page.goto(`/router/${ROUTER_ID}/wan`);

    const row = page.getByRole('row', { name: /home-l2tp/ });
    await row.getByRole('button', { name: /edit home-l2tp/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('Name')).toBeDisabled();
    await expect(dialog.getByLabel('Name')).toHaveValue('home-l2tp');
    await expect(dialog.getByLabel('Connect to')).toHaveValue('vpn.old.example.com');
    await expect(dialog.getByLabel('User')).toHaveValue('alice');
    await expect(dialog.getByRole('switch', { name: 'Use IPsec' })).toBeChecked();

    await dialog.getByLabel('Connect to').fill('vpn.new.example.com');
    await dialog.getByRole('button', { name: /save changes/i }).click();

    await expect.poll(() => lastPutBody?.connectTo).toBe('vpn.new.example.com');
    expect(lastPutBody).toEqual({ connectTo: 'vpn.new.example.com' });
    await expect(dialog).toBeHidden();
  });

  test('clears ipsec secret when toggling Use IPsec off in edit dialog', async ({
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
        body: envelope([{ ...baseClient, disabled: false }]),
      });
    });
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });
    await context.route('**/api/vpn/l2tp/client/home-l2tp', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({
            id: '*1',
            name: 'home-l2tp',
            disabled: false,
            running: false,
            connectTo: 'vpn.example.com',
            user: 'alice',
            password: 'pw',
            profile: 'default',
            useIPsec: true,
            ipsecSecret: 'oldsecret',
            comment: '',
          }),
        });
        return;
      }
      await route.fallback();
    });

    let lastPutBody: { ipsecSecret?: string } | null = null;
    await context.route('**/api/vpn/l2tp/client/*1', async (route) => {
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

    await page.goto(`/router/${ROUTER_ID}/wan`);
    const row = page.getByRole('row', { name: /home-l2tp/ });
    await row.getByRole('button', { name: /edit home-l2tp/i }).click();

    const dialog = page.getByRole('dialog');
    const ipsecSecret = dialog.getByLabel('IPsec secret');
    await expect(ipsecSecret).toHaveValue('oldsecret');

    await dialog.getByRole('switch', { name: 'Use IPsec' }).uncheck();
    await expect(ipsecSecret).toBeDisabled();
    await expect(ipsecSecret).toHaveValue('');

    await dialog.getByRole('button', { name: /save changes/i }).click();
    await expect.poll(() => lastPutBody?.ipsecSecret).toBe('');
  });

  test('deletes L2TP client via DELETE after confirm', async ({
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
      const body = listCalls === 1 ? [{ ...baseClient, disabled: false }] : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(body),
      });
    });
    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([]),
      });
    });

    let deleteCalls = 0;
    await context.route('**/api/vpn/l2tp/client/*1', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalls += 1;
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/wan`);

    const row = page.getByRole('row', { name: /home-l2tp/ });
    await row.getByRole('button', { name: /delete home-l2tp/i }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect.poll(() => deleteCalls).toBe(1);
    await expect(page.getByRole('row', { name: /home-l2tp/ })).toBeHidden();
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
    await context.route('**/api/interface/interfaces', async (route) => {
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

    await page.goto(`/router/${ROUTER_ID}/wan`);

    await expect(page.getByText('No VPN clients yet.')).toBeVisible();

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await expect(page.getByText('No VPN servers configured.')).toBeVisible();
  });
});
