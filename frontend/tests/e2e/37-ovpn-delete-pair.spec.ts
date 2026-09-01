import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_ovpn_pair';
const BASE_NAME = 'OpenVPN-Server-1779215157';
const TCP_NAME = `${BASE_NAME}-tcp`;
const UDP_NAME = `${BASE_NAME}-udp`;

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const ovpnServer = (name: string, protocol: string, port: number) => ({
  name,
  enabled: true,
  port,
  protocol,
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

test.describe('OpenVPN paired server deletion', () => {
  test('warns that the paired server is removed and deletes both', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.41' });
    await context.addInitScript(seedSession, ROUTER_ID);

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });
    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
    });

    let deleted = false;
    await context.route('**/api/vpn/servers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          ovpnServers: deleted
            ? []
            : [ovpnServer(TCP_NAME, 'tcp', 1194), ovpnServer(UDP_NAME, 'udp', 1194)],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });

    let deletedUrl: string | null = null;
    await context.route('**/api/vpn/ovpn/server/*', async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      deletedUrl = route.request().url();
      deleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ deleted: true }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const udpRow = page.getByRole('row', { name: new RegExp(UDP_NAME) });
    await expect(udpRow).toBeVisible();
    await udpRow.getByRole('button', { name: `Delete ${UDP_NAME}` }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText('Delete OpenVPN server pair')).toBeVisible();
    await expect(confirm).toContainText(`The paired server "${TCP_NAME}" is removed together`);
    await expect(confirm).toContainText(UDP_NAME);

    await confirm.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect.poll(() => deletedUrl).toContain(`/api/vpn/ovpn/server/${UDP_NAME}`);
    await expect(page.getByText(`Servers "${UDP_NAME}" and "${TCP_NAME}" deleted`)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(UDP_NAME) })).toHaveCount(0);
    await expect(page.getByRole('row', { name: new RegExp(TCP_NAME) })).toHaveCount(0);
  });

  test('keeps the single-server wording when there is no paired server', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.41' });
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
          ovpnServers: [ovpnServer(UDP_NAME, 'udp', 1194)],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page
      .getByRole('row', { name: new RegExp(UDP_NAME) })
      .getByRole('button', { name: `Delete ${UDP_NAME}` })
      .click();

    const confirm = page.getByRole('dialog');
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText('Delete VPN server')).toBeVisible();
    await expect(confirm).not.toContainText('The paired server');
  });
});
