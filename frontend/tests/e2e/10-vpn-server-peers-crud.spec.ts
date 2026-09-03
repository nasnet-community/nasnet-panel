import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_vsrv';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

test.describe('VPN servers tab', () => {
  test('opens server detail drawer and renders address/DNS/secret fields', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Server Router', host: '10.0.0.20' });

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

    await context.route('**/api/vpn/users', async (route) => {
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
          pptp: {
            enabled: true,
            port: 1723,
            localIp: '10.10.10.1',
            localIpPool: 'vpn-local-pool',
            remoteIp: '10.10.10.2-10.10.10.50',
            remoteIpPool: 'vpn-remote-pool',
          },
          l2tp: null,
          sstp: null,
        }),
      });
    });

    await context.route('**/api/vpn/pptp/server', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          enabled: true,
          auth: 'mschap2',
          profile: 'default',
          localAddress: '10.10.10.1',
          remoteAddress: '10.10.10.2-10.10.10.50',
          useCompression: 'yes',
          useEncryption: 'required',
          onlyOne: 'yes',
          changeTcpMss: 'yes',
          dnsServer: '1.1.1.1',
          secrets: [{ username: 'alice', password: 'alice123' }],
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const row = page.getByRole('row', { name: /PPTP/ }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('1723');
    await expect(page.getByRole('columnheader', { name: 'Remote IP' })).toHaveCount(0);

    await row.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Port', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Local IP', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Local IP pool', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Remote IP', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Remote IP pool', { exact: true })).toBeVisible();
    await expect(dialog.getByText('10.10.10.1')).toBeVisible();
    await expect(dialog.getByText('10.10.10.2-10.10.10.50')).toBeVisible();
    await expect(dialog.getByText('vpn-local-pool')).toBeVisible();
    await expect(dialog.getByText('vpn-remote-pool')).toBeVisible();
    await expect(dialog.getByText('1.1.1.1')).toBeVisible();
    await expect(dialog.getByText('alice', { exact: true })).toBeVisible();
    await expect(dialog.getByText('alice123')).toBeVisible();
  });

  test('shows the peer count of a WireGuard server in the servers list', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Server Router', host: '10.0.0.20' });
    await seedCredentials(ROUTER_ID);

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
          wireguards: [{ name: 'office-wg', enabled: true, port: 51820, protocol: 'udp' }],
          pptp: { enabled: true, port: 1723 },
          l2tp: null,
          sstp: null,
        }),
      });
    });

    await context.route('**/api/vpn/wireguard/peers/office-wg', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(
          ['phone', 'laptop', 'tablet'].map((name, i) => ({
            id: `*${i + 1}`,
            name,
            interfaceName: 'office-wg',
            publicKey: `key-${i + 1}`,
            endpointAddress: '',
            endpointPort: 0,
            currentEndpointAddress: '',
            currentEndpointPort: 0,
            allowedAddresses: `10.10.0.${i + 2}/32`,
            persistentKeepalive: '',
            lastHandshake: '',
            rxBytes: 0,
            txBytes: 0,
            rx: '0',
            tx: '0',
            dynamic: false,
            disabled: false,
          })),
        ),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await expect(page.getByRole('columnheader', { name: 'Peers' })).toBeVisible();

    const wgRow = page.getByRole('row', { name: /office-wg/ });
    await expect(wgRow.getByLabel('3 peers on office-wg')).toHaveText('3');

    const pptpRow = page.getByRole('row', { name: /PPTP/ });
    await expect(pptpRow.getByLabel(/peers on/)).toHaveCount(0);
  });

  test('switches server form via type tiles and keeps unsupported types disabled', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Server Router', host: '10.0.0.20' });

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

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const types = dialog.getByRole('radiogroup', { name: 'VPN server type' });
    await expect(types.getByRole('radio')).toHaveCount(4);
    await expect(types.getByRole('radio', { name: 'OpenVPN' })).toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Create OpenVPN server' })).toBeVisible();

    await types.getByRole('radio', { name: 'WireGuard' }).click();
    await expect(types.getByRole('radio', { name: 'WireGuard' })).toBeChecked();
    await expect(types.getByRole('radio', { name: 'OpenVPN' })).not.toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Create WireGuard server' })).toBeVisible();
    await expect(dialog.getByLabel('Listen port')).toHaveCount(0);
    await dialog.getByRole('switch', { name: 'Advanced mode' }).check();
    await expect(dialog.getByLabel('Listen port')).toBeVisible();

    const l2tp = types.getByRole('radio', { name: 'L2TP' });
    const sstp = types.getByRole('radio', { name: 'SSTP' });
    await expect(l2tp).toBeDisabled();
    await expect(l2tp).not.toBeChecked();

    await expect(sstp).toBeEnabled();
    await sstp.click();
    await expect(sstp).toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Enable SSTP server' })).toBeVisible();

    await types.getByRole('radio', { name: 'WireGuard' }).click();
    await l2tp.click({ force: true });
    await expect(types.getByRole('radio', { name: 'WireGuard' })).toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Create WireGuard server' })).toBeVisible();
  });

  test('creates an OpenVPN server without inline user fields', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Server Router', host: '10.0.0.20' });

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

    let lastPostBody: { clientCertificatePassword?: string; users?: unknown[] } | null = null;
    await context.route('**/api/vpn/ovpn/server', async (route) => {
      if (route.request().method() === 'POST') {
        lastPostBody = route.request().postDataJSON() as typeof lastPostBody;
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: envelope({ taskId: 'task-1', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    });

    await context.route('**/api/vpn/ovpn/server/status/task-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          taskId: 'task-1',
          status: 'completed',
          progress: 100,
          currentStep: 'Done',
          startTime: 0,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Add server' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog
        .getByRole('radiogroup', { name: 'VPN server type' })
        .getByRole('radio', { name: 'OpenVPN' }),
    ).toBeChecked();
    await expect(dialog.getByLabel(/Username/)).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Add user' })).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Create OpenVPN server' }).click();
    await expect(dialog.getByText('Certificate passphrase is required.')).toBeVisible();
    expect(lastPostBody).toBeNull();

    await dialog.getByLabel('Client certificate passphrase', { exact: true }).fill('certpass123');
    await dialog.getByRole('button', { name: 'Create OpenVPN server' }).click();

    await expect
      .poll(() => lastPostBody)
      .toEqual({ clientCertificatePassword: 'certpass123', users: [] });
    await expect(dialog).toBeHidden();
  });
});
