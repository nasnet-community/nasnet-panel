import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_net';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

test.describe('Internet routing page', () => {
  test('renders topology with active hops and detached WAN', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Net Router', host: '10.0.0.10' });

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

    await context.route('**/api/interface/interfaces', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([
          {
            id: '*1',
            name: 'ether1',
            type: 'ether',
            running: true,
            disabled: false,
            comment: 'Starlink uplink',
          },
          {
            id: '*2',
            name: 'ether2',
            type: 'ether',
            running: false,
            disabled: false,
            comment: 'Irancell mobile',
          },
          { id: '*3', name: 'bridge1', type: 'bridge', running: true, disabled: false },
        ]),
      });
    });

    await context.route('**/api/routes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([
          {
            id: '*1',
            dstAddress: '0.0.0.0/0',
            gateway: '100.64.0.1',
            interface: 'ether1',
            active: true,
            distance: 1,
          },
        ]),
      });
    });

    await context.route('**/api/vpn/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([
          {
            id: '*1',
            name: 'wg-mask',
            type: 'wg',
            running: true,
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
            comment: 'wg-mask',
          },
        ]),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByRole('heading', { name: /internet routing/i })).toBeVisible();
    await expect(page.getByText('Clients', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Starlink', { exact: true })).toBeVisible();
    await expect(page.getByText('Irancell', { exact: true })).toBeVisible();
    await expect(page.getByText('wg-mask', { exact: true })).toBeVisible();

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    await expect(svg.locator('path#edge-h_rtr_ether1')).toHaveCount(1);
    await expect(svg.locator('path#edge-h_rtr_ether2')).toHaveCount(1);
    await expect(svg.locator('path#edge-h_vpn_wg-mask')).toHaveCount(1);

    const dots = svg.locator('circle animateMotion');
    expect(await dots.count()).toBeGreaterThan(0);
  });

  test('Internet tab is enabled', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_tabs', name: 'Tabs Router' });
    await page.goto('/router/rtr_tabs');

    const tab = page.getByRole('tab', { name: /internet/i });
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
    await tab.click();
    await expect(page).toHaveURL(/\/router\/rtr_tabs\/internet$/);
  });
});
