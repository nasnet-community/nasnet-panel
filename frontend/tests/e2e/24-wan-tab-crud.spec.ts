import { test, expect } from './fixtures';
import type { BrowserContext, Page } from '@playwright/test';

const ROUTER_ID = 'rtr_wan';

// "Change" button order in WanPage: 0 Starlink, 1 Domestic.
const changeButton = (page: Page, index: number) =>
  page.getByRole('button', { name: 'Change' }).nth(index);

const newClientButton = (page: Page) => page.getByRole('button', { name: 'New' });

const envelope = <T>(data: T, status = 200) => JSON.stringify({ status, message: 'OK', data });

interface WanRouteState {
  interfaces: Array<{
    id: string;
    name: string;
    type: string;
    running: boolean;
    disabled: boolean;
    comment?: string;
  }>;
  vpnClients: Array<{
    id: string;
    name: string;
    type: string;
    running: boolean;
    disabled: boolean;
    mtu: number;
    macAddress: string;
    rxByte: number;
    txByte: number;
    rxPacket: number;
    txPacket: number;
    lastLinkUp: string;
    lastLinkDown: string;
    linkDowns: number;
    comment?: string;
  }>;
  wanPuts: Array<{
    body: { interface: string; type: string; ssid?: string; password?: string };
  }>;
  vpnPuts: Array<{ name: string; body: Record<string, unknown> }>;
  l2tpPosts: Array<Record<string, unknown>>;
  wgImports: Array<Record<string, unknown>>;
  l2tpDeletes: string[];
  wgDeletes: string[];
}

const setSessionCreds = async (context: BrowserContext, routerId: string) => {
  await context.addInitScript((rid) => {
    try {
      const key = 'nasnet-panel.session-credentials.v1';
      const map = { [rid]: { username: 'admin', password: 'test' } };
      window.sessionStorage.setItem(key, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }, routerId);
};

const setupWanRoutes = async (
  context: BrowserContext,
  state: WanRouteState,
  opts: { wanApplyDelayMs?: number } = {},
) => {
  await context.route('**/api/interface/interfaces', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(state.interfaces),
    });
  });

  await context.route('**/api/interface/wan', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON() as {
      interface: string;
      type: 'foreign' | 'domestic';
      ssid?: string;
      password?: string;
    };
    state.wanPuts.push({ body });
    const comment =
      body.type === 'foreign' ? 'WAN - Foreign Link(Foreign)' : 'WAN - Domestic Link(Domestic)';
    const apply = () => {
      const idx = state.interfaces.findIndex((i) => i.name === body.interface);
      if (idx >= 0) state.interfaces[idx] = { ...state.interfaces[idx], comment };
    };
    if (opts.wanApplyDelayMs) setTimeout(apply, opts.wanApplyDelayMs);
    else apply();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ interface: body.interface, type: body.type }),
    });
  });

  await context.route('**/api/wifi/scan/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope([{ ssid: 'CafeNet', security: 'wpa2', signal: '-48' }]),
    });
  });

  await context.route('**/api/vpn/clients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(state.vpnClients),
    });
  });

  await context.route('**/api/vpn/clients/*', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const name = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    const body = route.request().postDataJSON() as Record<string, unknown>;
    state.vpnPuts.push({ name, body });
    const idx = state.vpnClients.findIndex((c) => c.name === name);
    if (idx >= 0) {
      const next = { ...state.vpnClients[idx] };
      if (typeof body.disabled === 'boolean') next.disabled = body.disabled;
      if (typeof body.comment === 'string') next.comment = body.comment;
      state.vpnClients[idx] = next;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(state.vpnClients[idx] ?? { name }),
    });
  });

  await context.route('**/api/vpn/l2tp/client', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() as { name: string };
    state.l2tpPosts.push(body);
    const client = {
      id: `*l2tp-${state.vpnClients.length + 1}`,
      name: body.name,
      type: 'l2tp-out',
      running: false,
      disabled: false,
      mtu: 1500,
      macAddress: '',
      rxByte: 0,
      txByte: 0,
      rxPacket: 0,
      txPacket: 0,
      lastLinkUp: '',
      lastLinkDown: '',
      linkDowns: 0,
    };
    state.vpnClients.push(client);
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(client) });
  });

  await context.route('**/api/vpn/l2tp/client/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    const name = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    state.l2tpDeletes.push(name);
    state.vpnClients = state.vpnClients.filter((c) => c.name !== name);
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(null) });
  });

  await context.route('**/api/vpn/wireguard/import-config', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON() as { interfaceName: string };
    state.wgImports.push(body);
    const name = body.interfaceName.endsWith('-client')
      ? body.interfaceName
      : `${body.interfaceName}-client`;
    const client = {
      id: `*wg-${state.vpnClients.length + 1}`,
      name,
      type: 'wg',
      running: false,
      disabled: false,
      mtu: 1420,
      macAddress: '',
      rxByte: 0,
      txByte: 0,
      rxPacket: 0,
      txPacket: 0,
      lastLinkUp: '',
      lastLinkDown: '',
      linkDowns: 0,
    };
    state.vpnClients.push(client);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ interfaceName: name, interfaceIP: '10.0.0.2', peerName: 'peer' }),
    });
  });

  await context.route('**/api/vpn/wireguard/interface/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    const name = decodeURIComponent(route.request().url().split('/').pop() ?? '');
    state.wgDeletes.push(name);
    state.vpnClients = state.vpnClients.filter((c) => c.name !== name);
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(null) });
  });
};

const blankState = (): WanRouteState => ({
  interfaces: [
    { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
    { id: '*2', name: 'ether2', type: 'ether', running: true, disabled: false },
  ],
  vpnClients: [],
  wanPuts: [],
  vpnPuts: [],
  l2tpPosts: [],
  wgImports: [],
  l2tpDeletes: [],
  wgDeletes: [],
});

test.describe('WAN tab', () => {
  test('tab is enabled, lists the three sections and shows empty states', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    await setupWanRoutes(context, blankState());
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await expect(
      page.getByRole('heading', { name: 'Foreign / Starlink', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Domestic', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Starlink Masking VPN Client', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Domestic VPN Interfaces', exact: true }),
    ).toBeHidden();

    await expect(page.getByText('No Starlink uplinks yet')).toBeVisible();
    await expect(page.getByText('No VPN clients yet.')).toBeVisible();
  });

  test('add a Starlink uplink via real BE and move it to Domestic', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    const state = blankState();
    await setupWanRoutes(context, state);
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await changeButton(page, 0).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Starlink WAN').click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await dialog.getByRole('button', { name: /^save$/i }).click();

    await expect.poll(() => state.wanPuts.length).toBe(1);
    expect(state.wanPuts[0]).toMatchObject({ body: { interface: 'ether1', type: 'foreign' } });

    await expect(page.getByRole('cell', { name: 'ether1', exact: true })).toBeVisible();

    // Move to Domestic via the pencil button on the row.
    await page.getByRole('button', { name: /move ether1 to domestic/i }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^move$/i })
      .click();

    await expect.poll(() => state.wanPuts.length).toBe(2);
    expect(state.wanPuts[1]).toMatchObject({ body: { interface: 'ether1', type: 'domestic' } });
  });

  test('slow WAN change keeps the dialog in progress until the table reflects it', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    const state = blankState();
    await setupWanRoutes(context, state, { wanApplyDelayMs: 2500 });
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await changeButton(page, 0).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Starlink WAN').click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await dialog.getByRole('button', { name: /^save$/i }).click();

    await expect.poll(() => state.wanPuts.length).toBe(1);
    await expect(dialog.getByRole('button', { name: 'Saving…' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ether1', exact: true })).toBeHidden();

    await expect(page.getByRole('cell', { name: 'ether1', exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(dialog).toBeHidden();
  });

  test('add a wireless Starlink uplink sends ssid and password', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    const state = blankState();
    state.interfaces.push({
      id: '*3',
      name: 'wifi1',
      type: 'wifi',
      running: true,
      disabled: false,
    });
    await setupWanRoutes(context, state);
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await changeButton(page, 0).click();
    const dialog = page.getByRole('dialog', { name: 'Add Starlink uplink' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('radio', { name: 'Wireless' }).click();
    await dialog.getByLabel('Starlink WAN').click();
    await page.getByRole('option', { name: 'wifi1' }).click();
    await dialog.getByRole('button', { name: 'Choose wireless network' }).click();

    const scanDialog = page.getByRole('dialog', { name: 'Choose a wireless network' });
    await expect(scanDialog).toBeVisible();
    await scanDialog.getByLabel('Wireless network').click();
    await page.getByRole('option', { name: /CafeNet/ }).click();
    await scanDialog.getByLabel('Wireless password').fill('secret-pass');
    await scanDialog.getByRole('button', { name: 'Verify and connect' }).click();
    await expect(scanDialog).toBeHidden();

    await dialog.getByRole('button', { name: /^save$/i }).click();

    await expect.poll(() => state.wanPuts.length).toBe(1);
    expect(state.wanPuts[0]).toMatchObject({
      body: { interface: 'wifi1', type: 'foreign', ssid: 'CafeNet', password: 'secret-pass' },
    });
  });

  test('already-tagged interface is excluded from the add picker', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    const state = blankState();
    state.interfaces[0].comment = 'WAN - Foreign Link(Foreign)';
    await setupWanRoutes(context, state);
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await changeButton(page, 1).click(); // Domestic add modal
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Domestic WAN').click();

    // ether1 is already tagged Foreign → should not be in the dropdown.
    await expect(page.getByRole('option', { name: 'ether1' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'ether2' })).toBeVisible();
  });

  test('add an L2TP VPN client via the masking section', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await setSessionCreds(context, ROUTER_ID);
    const state = blankState();
    await setupWanRoutes(context, state);
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await newClientButton(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name').fill('mask-one');
    await dialog.getByLabel('Connect to').fill('vpn.example.com');
    await dialog.getByLabel('User').fill('user');
    await dialog.getByLabel('Password', { exact: true }).fill('secret');
    await dialog.getByRole('button', { name: 'Add client' }).click();

    await expect.poll(() => state.l2tpPosts.length).toBe(1);
    expect(state.l2tpPosts[0]).toMatchObject({
      name: 'mask-one',
      connectTo: 'vpn.example.com',
      user: 'user',
      password: 'secret',
    });
    await expect(page.getByRole('cell', { name: 'mask-one', exact: true })).toBeVisible();
  });
});
