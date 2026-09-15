import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_vpn_active';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

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

const pppSessions = [
  {
    id: '*A1',
    name: 'alice',
    service: 'sstp',
    address: '10.40.0.2',
    callerID: '203.0.113.7',
    uptime: '1h2m3s',
    encoding: 'AES256-CBC',
    sessionID: '0x81000001',
  },
  {
    id: '*A2',
    name: 'bob',
    service: 'ovpn',
    address: '10.30.0.5',
    callerID: '198.51.100.4',
    uptime: '12m',
  },
];

const wireguardPeers = [
  {
    id: '*W1',
    name: 'laptop',
    interfaceName: 'wg-server',
    publicKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    allowedAddresses: '10.50.0.2/32',
    clientAddress: '10.50.0.2/32',
    lastHandshake: '42s',
    rxBytes: 1024,
    txBytes: 2048,
    rx: '1.0 KiB',
    tx: '2.0 KiB',
    dynamic: false,
    disabled: false,
  },
];

test.describe('VPN active connections', () => {
  let deletedIds: string[];

  test.beforeEach(async ({ context, resetMocks, seedRouter }) => {
    deletedIds = [];
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Active Router', host: '10.0.0.43' });
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
          wireguards: [{ name: 'wg-server', enabled: true, port: 51820 }],
          pptp: null,
          l2tp: null,
          sstp: { enabled: true, port: 443 },
        }),
      });
    });
    await context.route('**/api/vpn/wireguard/peers/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(wireguardPeers),
      });
    });
    await context.route('**/api/vpn/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ pppSessions, wireguardPeers }),
      });
    });
    await context.route('**/api/vpn/active/*', async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      const url = new URL(route.request().url());
      deletedIds.push(decodeURIComponent(url.pathname.split('/').pop() ?? ''));
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(null) });
    });
  });

  test('lists every active connection and disconnects a PPP session', async ({ page }) => {
    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await expect(page.getByText('Clients currently connected to your VPN servers.')).toBeVisible();

    const aliceRow = page.getByRole('row', { name: /alice/ });
    await expect(aliceRow.getByText('SSTP')).toBeVisible();
    await expect(aliceRow.getByText('10.40.0.2')).toBeVisible();
    await expect(aliceRow.getByText('1h2m3s')).toBeVisible();

    const bobRow = page.getByRole('row', { name: /bob/ });
    await expect(bobRow.getByText('OpenVPN')).toBeVisible();

    const laptopRow = page.getByRole('row', { name: /laptop/ });
    await expect(laptopRow.getByText('WireGuard')).toBeVisible();
    await expect(laptopRow.getByText('handshake 42s ago')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disconnect laptop' })).toHaveCount(0);

    let activeRequests = 0;
    page.on('request', (req) => {
      if (req.method() === 'GET' && new URL(req.url()).pathname === '/api/vpn/active') {
        activeRequests += 1;
      }
    });

    await page.getByRole('button', { name: 'Disconnect alice' }).click();
    await expect(page.getByText('Disconnect session')).toBeVisible();
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();

    await expect.poll(() => deletedIds).toEqual(['*A1']);
    await expect(page.getByRole('row', { name: /alice/ })).toHaveCount(0);
    expect(activeRequests).toBe(0);
    await expect(page.getByRole('row', { name: /bob/ })).toBeVisible();

    await page.waitForTimeout(5500);
    await expect(page.getByRole('row', { name: /alice/ })).toHaveCount(0);
  });

  test('shows only matching sessions on a server details view', async ({ page, context }) => {
    await context.route('**/api/vpn/sstp/server', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          enabled: true,
          port: 443,
          certificate: 'sstp-cert',
          verifyClientCertificate: false,
          tlsVersion: 'any',
        }),
      });
    });
    await context.route('**/api/vpn/wireguard/detailed/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: '*1',
          name: 'wg-server',
          running: true,
          disabled: false,
          mtu: 1420,
          macAddress: '',
          publicKey: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
          privateKey: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
          listenPort: 51820,
          comment: '',
          peers: [],
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page
      .getByRole('row', { name: /SSTP/ })
      .first()
      .getByText('SSTP', { exact: true })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('SSTP server: SSTP')).toBeVisible();
    const section = dialog.getByRole('region', { name: 'Active connections' });
    await expect(section.getByRole('row', { name: /alice/ })).toBeVisible();
    await expect(section.getByRole('row', { name: /bob/ })).toHaveCount(0);
    await expect(section.getByRole('row', { name: /laptop/ })).toHaveCount(0);

    await section.getByRole('button', { name: 'Disconnect alice' }).click();
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect.poll(() => deletedIds).toEqual(['*A1']);
    await expect(section.getByRole('row', { name: /alice/ })).toHaveCount(0);
    await expect(section.getByText('No active connections.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();

    await page
      .getByRole('row', { name: /wg-server/ })
      .first()
      .getByText('wg-server')
      .first()
      .click();
    const wgDialog = page.getByRole('dialog');
    await expect(wgDialog.getByText('WIREGUARD server: wg-server')).toBeVisible();
    const wgSection = wgDialog.getByRole('region', { name: 'Active connections' });
    await expect(wgSection.getByRole('row', { name: /laptop/ })).toBeVisible();
    await expect(wgSection.getByRole('row', { name: /bob/ })).toHaveCount(0);
    await expect(wgSection.getByRole('button', { name: 'Disconnect laptop' })).toHaveCount(0);
  });
});
