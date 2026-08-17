import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_net';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

async function seedCredentials(context: BrowserContext, routerId: string) {
  await context.addInitScript((id) => {
    try {
      const key = 'nasnet-panel.session-credentials.v1';
      const raw = window.sessionStorage.getItem(key);
      const map = (raw ? JSON.parse(raw) : {}) as Record<
        string,
        { username: string; password: string }
      >;
      map[id] = { username: 'admin', password: 'test' };
      window.sessionStorage.setItem(key, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }, routerId);
}

const wgMaskIface = {
  id: '*5',
  name: 'wg-client-mask',
  type: 'wg',
  running: true,
  disabled: false,
  comment: 'wg-mask',
};

const defaultInterfaces = [
  {
    id: '*1',
    name: 'ether1',
    type: 'ether',
    running: true,
    disabled: false,
    comment: 'WAN - Foreign Link',
  },
  {
    id: '*2',
    name: 'ether2',
    type: 'ether',
    running: false,
    disabled: false,
    comment: 'WAN - Foreign Link',
  },
  {
    id: '*3',
    name: 'ether3',
    type: 'ether',
    running: true,
    disabled: false,
    comment: 'WAN - Domestic Link',
  },
  { id: '*4', name: 'bridge1', type: 'bridge', running: true, disabled: false },
  wgMaskIface,
];

interface NetStatusEntry {
  host: string;
  status: string;
  since: string;
  type: 'foreign' | 'vpn' | 'domestic' | '';
}

interface TopologyMockOptions {
  interfaces?: Array<(typeof defaultInterfaces)[number]>;
  gateway?: string | null;
  netStatus?: NetStatusEntry[];
}

const netProbe = (type: NetStatusEntry['type'], status: string): NetStatusEntry => ({
  host: type === 'foreign' ? '1.1.1.1' : type === 'vpn' ? '1.0.0.1' : '217.218.127.127',
  status,
  since: '2026-07-22 10:00:00',
  type,
});

async function mockTopologyApi(context: BrowserContext, opts: TopologyMockOptions = {}) {
  await context.route('**/api/net/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(opts.netStatus ?? []),
    });
  });

  await context.route('**/api/interface/interfaces', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(opts.interfaces ?? defaultInterfaces),
    });
  });

  await context.route('**/api/route/foreign-gateway', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ gateway: opts.gateway === undefined ? 'wg-client-mask' : opts.gateway }),
    });
  });
}

test.describe('Internet routing page', () => {
  test('renders topology with active hops and detached WAN', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context);

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByRole('heading', { name: /internet routing/i })).toBeVisible();
    await expect(page.getByText('Clients', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('WAN - Foreign Link', { exact: true })).toHaveCount(2);
    await expect(page.getByText('WAN - Domestic Link', { exact: true })).toBeVisible();
    await expect(page.getByText('wg-mask', { exact: true })).toBeVisible();

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether1')).toHaveCount(1);
    await expect(svg.locator('path#edge-h_rtr_ether2')).toHaveCount(1);
    await expect(svg.locator('path#edge-h_vpn_wg-client-mask')).toHaveCount(1);

    await expect(page.getByText('Internet', { exact: true }).first()).toBeVisible();
    await expect(svg.locator('path#edge-h_internet_vpn_wg-client-mask')).toHaveCount(1);
    await expect(svg.locator('path#edge-h_internet_wan_ether3')).toHaveCount(1);

    const dots = svg.locator('circle animateMotion');
    expect(await dots.count()).toBeGreaterThan(0);
  });

  test('renders column headers for each populated column', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context);

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();
    await expect(svg.getByText('WAN', { exact: true })).toBeVisible();
    await expect(svg.getByText('VPN', { exact: true })).toBeVisible();
    await expect(svg.getByText('Router', { exact: true }).first()).toBeVisible();
  });

  test('styles active and idle edges differently', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context);

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether1')).toHaveAttribute('marker-end', /arr-active/);
    await expect(svg.locator('path#edge-h_rtr_ether2')).toHaveAttribute('marker-end', /arr-idle/);

    const d = await svg.locator('path#edge-h_internet_wan_ether3').getAttribute('d');
    expect(d).toMatch(/^M -?[\d.]+ -?[\d.]+(?: L -?[\d.]+ -?[\d.]+)+$/);
  });

  test('marks only the routed VPN path as active', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      interfaces: [
        ...defaultInterfaces,
        { ...wgMaskIface, id: '*6', name: 'wg-client-alt', comment: 'wg-alt' },
      ],
      gateway: 'wg-client-mask',
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
    await expect(svg.locator('path#edge-h_vpn_wg-client-alt')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
    await expect(svg.locator('path#edge-h_internet_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
    await expect(svg.locator('path#edge-h_internet_vpn_wg-client-alt')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
  });

  test('keeps the domestic WAN path always active', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      interfaces: defaultInterfaces.map((i) =>
        i.name === 'ether3' ? { ...i, running: false } : i,
      ),
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether3')).toHaveAttribute('marker-end', /arr-active/);
    await expect(svg.locator('path#edge-h_internet_wan_ether3')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
  });

  test('activating a tunnel from the hop dialog points routes at it and disables others', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      interfaces: [
        ...defaultInterfaces.filter((i) => i.name !== 'wg-client-mask'),
        { ...wgMaskIface, running: false, disabled: true },
        { ...wgMaskIface, id: '*6', name: 'wg-client-alt', comment: 'wg-alt' },
      ],
      gateway: 'wg-client-alt',
    });

    let targetPutBody: { disabled?: boolean } | null = null;
    await context.route('**/api/vpn/clients/wg-client-mask', async (route) => {
      targetPutBody = route.request().postDataJSON() as typeof targetPutBody;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ ...wgMaskIface, disabled: false }),
      });
    });

    let otherPutBody: { disabled?: boolean } | null = null;
    await context.route('**/api/vpn/clients/wg-client-alt', async (route) => {
      otherPutBody = route.request().postDataJSON() as typeof otherPutBody;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ ...wgMaskIface, id: '*6', name: 'wg-client-alt', disabled: true }),
      });
    });

    let gatewayPutBody: { gateway?: string } | null = null;
    await context.route('**/api/route/foreign-gateway', async (route) => {
      if (route.request().method() === 'PUT') {
        gatewayPutBody = route.request().postDataJSON() as typeof gatewayPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ gateway: 'wg-client-mask', routesUpdated: 2 }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ gateway: 'wg-client-alt' }),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await page.getByRole('button', { name: 'Configure wg-mask' }).click();
    await page.getByRole('switch', { name: /active/i }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => targetPutBody?.disabled).toBe(false);
    await expect.poll(() => gatewayPutBody?.gateway).toBe('wg-client-mask');
    await expect.poll(() => otherPutBody?.disabled).toBe(true);
  });

  test('marks no VPN path as active when no gateway route exists', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, { gateway: null });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
    await expect(svg.locator('path#edge-h_internet_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
  });

  test('grays the routed VPN path when the vpn probe is down', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      gateway: 'wg-client-mask',
      netStatus: [netProbe('vpn', 'down'), netProbe('foreign', 'up'), netProbe('domestic', 'up')],
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
    await expect(svg.locator('path#edge-h_internet_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
    await expect(svg.locator('path#edge-h_rtr_ether1')).toHaveAttribute('marker-end', /arr-active/);
    await expect(svg.locator('path#edge-h_internet_wan_ether3')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
  });

  test('grays the domestic path when the domestic probe is down', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      gateway: 'wg-client-mask',
      netStatus: [netProbe('domestic', 'down'), netProbe('vpn', 'up')],
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether3')).toHaveAttribute('marker-end', /arr-idle/);
    await expect(svg.locator('path#edge-h_internet_wan_ether3')).toHaveAttribute(
      'marker-end',
      /arr-idle/,
    );
    await expect(svg.locator('path#edge-h_vpn_wg-client-mask')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
  });

  test('grays the foreign WAN link when the foreign probe is down', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context, {
      gateway: 'wg-client-mask',
      netStatus: [netProbe('foreign', 'down'), netProbe('domestic', 'up')],
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether1')).toHaveAttribute('marker-end', /arr-idle/);
    await expect(svg.locator('path#edge-h_rtr_ether3')).toHaveAttribute('marker-end', /arr-active/);
    await expect(svg.locator('path#edge-h_internet_wan_ether3')).toHaveAttribute(
      'marker-end',
      /arr-active/,
    );
  });

  test('topology stays scrollable on mobile viewports', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockTopologyApi(context);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/router/${ROUTER_ID}/internet`);

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();
    const box = await svg.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeGreaterThan(375);
  });

  test('Internet tab is enabled', async ({ page, resetMocks, seedRouter, mockOverviewBackend }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_tabs', name: 'Tabs Router', host: '10.0.0.9' });
    await mockOverviewBackend({ id: 'rtr_tabs' });
    await page.goto('/router/rtr_tabs');

    const tab = page.getByRole('tab', { name: /internet/i });
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
    await tab.click();
    await expect(page).toHaveURL(/\/router\/rtr_tabs\/internet$/);
  });
});
