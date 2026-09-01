import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_wgsimple';
const INTERFACE_NAME = 'office-server';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

interface WgServerBody {
  name?: string;
  listenPort?: number;
  localAddress?: string;
  mtu?: number;
  comment?: string;
  privateKey?: string;
  disabled?: boolean;
}

interface WgPeerBody {
  interfaceName?: string;
  allowedAddresses?: string;
  savePrivateKey?: boolean;
  name?: string;
  publicKey?: string;
}

async function stubVpnPage(
  context: import('@playwright/test').BrowserContext,
  wireguards: Array<{ name: string; enabled: boolean; port: number; protocol: string }>,
) {
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
      body: envelope({ ovpnServers: [], wireguards, pptp: null, l2tp: null, sstp: null }),
    });
  });
}

test.describe('WireGuard simple mode', () => {
  test('creates a WireGuard server from the name alone', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubVpnPage(context, []);

    let lastPostBody: WgServerBody | null = null;
    await context.route('**/api/vpn/wireguard/server', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      lastPostBody = route.request().postDataJSON() as WgServerBody;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: '*1',
          name: INTERFACE_NAME,
          localAddress: '192.168.30.1/24',
          mtu: 1420,
          listenPort: 13231,
          publicKey: 'server-public-key',
          privateKey: 'server-private-key',
          disabled: false,
          comment: '',
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: 'Add server' }).click();

    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'WireGuard' })
      .click();

    await expect(dialog.getByLabel('Name', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Listen port')).toHaveCount(0);
    await expect(dialog.getByLabel('Local address')).toHaveCount(0);
    await expect(dialog.getByLabel('MTU')).toHaveCount(0);
    await expect(dialog.getByLabel('Private key')).toHaveCount(0);
    await expect(dialog.getByLabel('Comment')).toHaveCount(0);

    await dialog.getByLabel('Name', { exact: true }).fill('office');
    await dialog.getByRole('button', { name: 'Create WireGuard server' }).click();

    await expect.poll(() => lastPostBody).toEqual({ name: 'office' });
    await expect(dialog).toBeHidden();
  });

  test('advanced mode reveals the optional WireGuard fields', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubVpnPage(context, []);

    let lastPostBody: WgServerBody | null = null;
    await context.route('**/api/vpn/wireguard/server', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      lastPostBody = route.request().postDataJSON() as WgServerBody;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: '*1',
          name: INTERFACE_NAME,
          localAddress: '10.8.0.1/24',
          mtu: 1420,
          listenPort: 51820,
          publicKey: 'server-public-key',
          privateKey: 'server-private-key',
          disabled: false,
          comment: 'lab',
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: 'Add server' }).click();

    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'WireGuard' })
      .click();

    const toggle = dialog.getByRole('switch', { name: 'Advanced mode' });
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.check();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const advanced = dialog.getByRole('group', { name: 'Advanced WireGuard server settings' });
    await expect(advanced).toBeVisible();
    await expect(advanced.getByLabel('Listen port')).toBeVisible();
    await expect(advanced.getByLabel('Local address')).toBeVisible();
    await expect(advanced.getByLabel('MTU')).toBeVisible();
    await expect(advanced.getByLabel('Private key')).toBeVisible();
    await expect(advanced.getByLabel('Comment')).toBeVisible();

    await dialog.getByLabel('Name', { exact: true }).fill('office');
    await advanced.getByLabel('Listen port').fill('51820');
    await advanced.getByLabel('Comment').fill('lab');
    await dialog.getByRole('button', { name: 'Create WireGuard server' }).click();

    await expect
      .poll(() => lastPostBody)
      .toEqual({ name: 'office', listenPort: 51820, comment: 'lab' });
  });

  test('creates a peer with no input and shows its client config', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WG Router', host: '10.0.0.30' });
    await seedCredentials(ROUTER_ID);
    await stubVpnPage(context, [
      { name: INTERFACE_NAME, enabled: true, port: 13231, protocol: 'udp' },
    ]);

    let peers: Array<Record<string, unknown>> = [];
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
          peers,
        }),
      });
    });

    let lastPeerBody: WgPeerBody | null = null;
    await context.route('**/api/vpn/wireguard/peer', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      lastPeerBody = route.request().postDataJSON() as WgPeerBody;
      peers = [
        {
          id: '*2',
          name: 'ab12cd34',
          interfaceName: INTERFACE_NAME,
          publicKey: 'peer-public-key',
          privateKey: 'peer-private-key',
          endpointAddress: '',
          endpointPort: 0,
          currentEndpointAddress: '',
          currentEndpointPort: 0,
          allowedAddresses: '0.0.0.0/0',
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
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          name: 'ab12cd34',
          interfaceName: INTERFACE_NAME,
          publicKey: 'peer-public-key',
          privateKey: 'peer-private-key',
          preSharedKey: 'peer-preshared-key',
          endpointAddress: '',
          endpointPort: 0,
          allowedAddresses: '0.0.0.0/0',
          persistentKeepalive: 0,
          disabled: false,
        }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page
      .getByRole('row', { name: new RegExp(INTERFACE_NAME) })
      .first()
      .click();

    const details = page.getByRole('dialog');
    await expect(details.getByText('No peers configured.')).toBeVisible();
    await details.getByRole('button', { name: 'Add peer' }).click();

    const peerDialog = page.getByRole('dialog').last();
    await expect(peerDialog.getByRole('switch', { name: 'Advanced mode' })).not.toBeChecked();
    await expect(peerDialog.getByLabel('Allowed addresses')).toHaveCount(0);
    await expect(peerDialog.getByLabel('Endpoint address (optional)')).toHaveCount(0);
    await expect(peerDialog.getByLabel('Public key')).toHaveCount(0);

    await peerDialog.getByRole('button', { name: 'Create peer' }).click();

    await expect
      .poll(() => lastPeerBody)
      .toEqual({
        interfaceName: INTERFACE_NAME,
        allowedAddresses: '0.0.0.0/0',
        savePrivateKey: true,
      });

    const configDialog = page.getByRole('dialog').filter({ hasText: 'Client config - ab12cd34' });
    await expect(configDialog).toBeVisible();
    await expect(configDialog.getByText('PrivateKey = peer-private-key')).toBeVisible();
    await expect(configDialog.getByText('PublicKey = server-public-key')).toBeVisible();
    await expect(configDialog.getByLabel('Server endpoint')).toHaveValue('10.0.0.30:13231');
  });
});
