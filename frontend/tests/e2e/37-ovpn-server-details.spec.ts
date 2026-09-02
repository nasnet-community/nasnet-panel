import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_ovpn_details';
const SERVER_NAME = 'OpenVPN-Server-1779215157';
const COMMENT = 'Client Certificate Password: s3cr3t-pass';

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

test.describe('OpenVPN server details', () => {
  test.beforeEach(async ({ context, resetMocks, seedRouter }) => {
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
          ovpnServers: [
            {
              name: SERVER_NAME,
              enabled: true,
              port: 1194,
              protocol: 'tcp',
              localIp: '10.30.0.1',
              localIpPool: 'ovpn-local-pool',
              remoteIp: '10.30.0.2-10.30.0.50',
              remoteIpPool: 'ovpn-pool',
            },
          ],
          wireguards: [],
          pptp: null,
          l2tp: null,
          sstp: null,
        }),
      });
    });
  });

  test('shows the comment and hides the removed configuration rows', async ({ page, context }) => {
    await context.route(`**/api/vpn/ovpn/server/${SERVER_NAME}`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          name: SERVER_NAME,
          port: 1194,
          mode: 'ip',
          protocol: 'tcp',
          macAddress: 'FE:45:1A:2B:3C:4D',
          certificate: 'ovpn-server-cert',
          requireClientCertificate: true,
          auth: 'sha1',
          cipher: 'aes256',
          userAuthMethod: 'password',
          enabled: true,
          comment: COMMENT,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page
      .getByRole('row', { name: new RegExp(SERVER_NAME) })
      .getByText(SERVER_NAME)
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(`OPENVPN server: ${SERVER_NAME}`)).toBeVisible();

    await expect(dialog.getByText('Comment', { exact: true })).toBeVisible();
    await expect(dialog.getByText(COMMENT)).toBeVisible();
    await expect(dialog.locator('strong', { hasText: COMMENT })).toBeVisible();

    await expect(dialog.getByText('Certificate', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Mode', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('MAC address', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('Auth', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('Cipher', { exact: true })).toHaveCount(0);
    await expect(dialog.getByText('User auth method', { exact: true })).toHaveCount(0);
  });

  test('falls back to a placeholder when the server has no comment', async ({ page, context }) => {
    await context.route(`**/api/vpn/ovpn/server/${SERVER_NAME}`, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          name: SERVER_NAME,
          port: 1194,
          protocol: 'tcp',
          certificate: 'ovpn-server-cert',
          requireClientCertificate: true,
          enabled: true,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page
      .getByRole('row', { name: new RegExp(SERVER_NAME) })
      .getByText(SERVER_NAME)
      .click();

    const dialog = page.getByRole('dialog');
    const commentValue = dialog
      .getByText('Comment', { exact: true })
      .locator('xpath=following-sibling::dd[1]');
    await expect(commentValue).toHaveText('–');
    await expect(commentValue.locator('strong')).toHaveCount(0);
  });
});
