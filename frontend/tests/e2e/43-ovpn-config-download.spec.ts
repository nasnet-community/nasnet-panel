import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_ovpn_download';
const SERVER_NAME = 'office-ovpn-tcp';
const OVPN_PROFILE = 'client\ndev tun\nproto tcp\nremote 198.51.100.7 1194\n';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

test.describe('OpenVPN client config download', () => {
  test.beforeEach(async ({ context, resetMocks, seedRouter, seedCredentials }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'OVPN Router', host: '10.0.0.42' });
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

  test('asks for the server address and downloads the profile', async ({ page, context }) => {
    const exportQueries: Array<Record<string, string>> = [];
    await context.route('**/api/vpn/ovpn/server/export*', async (route) => {
      exportQueries.push(Object.fromEntries(new URL(route.request().url()).searchParams));
      await route.fulfill({
        status: 200,
        contentType: 'application/x-openvpn-profile',
        headers: { 'Content-Disposition': `attachment; filename="${SERVER_NAME}.ovpn"` },
        body: OVPN_PROFILE,
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: `Download client config for ${SERVER_NAME}` }).click();

    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: `Export OpenVPN client - ${SERVER_NAME}` });
    await expect(dialog).toBeVisible();
    await expect(page.getByText(`OPENVPN server: ${SERVER_NAME}`)).toHaveCount(0);
    expect(exportQueries).toEqual([]);

    const address = dialog.getByLabel('Public address');
    await expect(address).toHaveValue('10.0.0.42');
    await address.fill('198.51.100.7');

    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download .ovpn' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(`${SERVER_NAME}.ovpn`);
    expect(exportQueries).toEqual([{ name: SERVER_NAME, publicAddress: '198.51.100.7' }]);
    await expect(dialog).toHaveCount(0);
  });

  test('blocks the download until a valid address is entered', async ({ page, context }) => {
    let exportCalls = 0;
    await context.route('**/api/vpn/ovpn/server/export*', async (route) => {
      exportCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/x-openvpn-profile',
        body: OVPN_PROFILE,
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: `Download client config for ${SERVER_NAME}` }).click();

    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: `Export OpenVPN client - ${SERVER_NAME}` });
    const address = dialog.getByLabel('Public address');
    await address.fill('');
    await address.blur();

    await expect(dialog.getByRole('button', { name: 'Download .ovpn' })).toBeDisabled();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    expect(exportCalls).toBe(0);
  });

  test('shows the backend error and keeps the modal open', async ({ page, context }) => {
    await context.route('**/api/vpn/ovpn/server/export*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 500,
          message: 'Internal Server Error',
          error: 'failed to export client configuration',
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: `Download client config for ${SERVER_NAME}` }).click();

    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: `Export OpenVPN client - ${SERVER_NAME}` });
    await dialog.getByRole('button', { name: 'Download .ovpn' }).click();

    await expect(dialog.getByRole('alert')).toHaveText('failed to export client configuration');
    await expect(dialog.getByRole('button', { name: 'Download .ovpn' })).toBeEnabled();
  });
});
