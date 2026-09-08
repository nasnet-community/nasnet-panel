import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_wgexport';
const INTERFACE_NAME = 'office-server';
const PEER_NAME = 'laptop';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const PEER_CONFIG =
  '[Interface]\nPrivateKey = peer-private-key\nAddress = 192.168.30.2/32\n\n' +
  '[Peer]\nPublicKey = server-public-key\nEndpoint = 203.0.113.10:13231\n';

async function stubServerDetails(context: import('@playwright/test').BrowserContext) {
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
        wireguards: [{ name: INTERFACE_NAME, enabled: true, port: 13231, protocol: 'udp' }],
        pptp: null,
        l2tp: null,
        sstp: null,
      }),
    });
  });
  await context.route(`**/api/vpn/wireguard/detailed/${INTERFACE_NAME}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        id: '*1',
        name: INTERFACE_NAME,
        running: true,
        disabled: false,
        mtu: 1420,
        macAddress: '',
        publicKey: 'server-public-key',
        privateKey: 'server-private-key',
        listenPort: 13231,
        comment: '',
        peers: [
          {
            id: '*2',
            name: PEER_NAME,
            interfaceName: INTERFACE_NAME,
            publicKey: 'peer-public-key',
            privateKey: 'peer-private-key',
            endpointAddress: '',
            endpointPort: 0,
            currentEndpointAddress: '',
            currentEndpointPort: 0,
            allowedAddresses: '192.168.30.2/32',
            preSharedKey: 'peer-preshared-key',
            persistentKeepalive: '',
            lastHandshake: '',
            rxBytes: 0,
            txBytes: 0,
            rx: '0',
            tx: '0',
            dynamic: false,
            disabled: false,
          },
        ],
      }),
    });
  });
}

async function openPeerConfigDialog(page: import('@playwright/test').Page) {
  await page.goto(`/router/${ROUTER_ID}/vpn`);
  await page
    .getByRole('row', { name: new RegExp(INTERFACE_NAME) })
    .first()
    .click();
  await page.getByRole('button', { name: `Client config for peer ${PEER_NAME}` }).click();
  return page.getByRole('dialog').filter({ hasText: `Client config - ${PEER_NAME}` });
}

test.describe('WireGuard peer export', () => {
  test('requests the config from the backend and renders it', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubServerDetails(context);

    const exportQueries: Array<Record<string, string>> = [];
    await context.route('**/api/vpn/wireguard/peer/export*', async (route) => {
      const params = new URL(route.request().url()).searchParams;
      exportQueries.push(Object.fromEntries(params));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ filename: 'office-laptop-wg.conf', config: PEER_CONFIG }),
      });
    });

    const dialog = await openPeerConfigDialog(page);
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('Server public address')).toHaveValue('10.0.0.30');
    await expect
      .poll(() => exportQueries)
      .toEqual([{ nameOrID: '*2', publicAddress: '10.0.0.30' }]);

    await expect(dialog.getByText('PrivateKey = peer-private-key')).toBeVisible();
    await expect(dialog.getByText('Endpoint = 203.0.113.10:13231')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Copy' })).toBeEnabled();
    await expect(dialog.getByRole('button', { name: 'Download .conf' })).toBeEnabled();
  });

  test('regenerates the config for a new public address', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubServerDetails(context);

    const exportQueries: Array<Record<string, string>> = [];
    await context.route('**/api/vpn/wireguard/peer/export*', async (route) => {
      const params = new URL(route.request().url()).searchParams;
      exportQueries.push(Object.fromEntries(params));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          filename: 'office-laptop-wg.conf',
          config: PEER_CONFIG.replace('203.0.113.10', params.get('publicAddress') ?? ''),
        }),
      });
    });

    const dialog = await openPeerConfigDialog(page);
    await expect.poll(() => exportQueries.length).toBe(1);

    await dialog.getByLabel('Server public address').fill('198.51.100.7');
    await dialog.getByRole('button', { name: 'Generate' }).click();

    await expect
      .poll(() => exportQueries.at(-1))
      .toEqual({ nameOrID: '*2', publicAddress: '198.51.100.7' });
    await expect(dialog.getByText('Endpoint = 198.51.100.7:13231')).toBeVisible();
  });

  test('surfaces a backend export failure', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubServerDetails(context);

    await context.route('**/api/vpn/wireguard/peer/export*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 400,
          message: 'Bad Request',
          error: 'publicAddress must be a valid IP address',
        }),
      });
    });

    const dialog = await openPeerConfigDialog(page);

    await expect(dialog.getByText('publicAddress must be a valid IP address')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Copy' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Download .conf' })).toBeDisabled();
  });
});
