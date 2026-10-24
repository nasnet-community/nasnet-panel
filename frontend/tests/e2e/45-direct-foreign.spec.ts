import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_direct';

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

const interfaces = [
  {
    id: '*1',
    name: 'ether1',
    type: 'ether',
    running: true,
    disabled: false,
    comment: 'WAN - Foreign Link',
  },
  {
    id: '*5',
    name: 'wg-client-mask',
    type: 'wg',
    running: true,
    disabled: false,
    comment: 'wg-mask',
  },
];

async function mockApi(
  context: BrowserContext,
  state: {
    enabled: boolean;
    ready: boolean;
    vpnDown?: boolean;
    rules?: Array<{ id: string; comment: string; disabled: boolean }>;
  },
) {
  const puts: unknown[] = [];
  await context.route('**/api/net/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(
        state.vpnDown === false
          ? []
          : [{ host: '1.0.0.1', status: 'down', since: '2026-07-22 10:00:00', type: 'vpn' }],
      ),
    }),
  );
  await context.route('**/api/interface/interfaces', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: envelope(interfaces) }),
  );
  await context.route('**/api/route/foreign-gateway', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ gateway: 'wg-client-mask' }),
    }),
  );
  await context.route('**/api/route/direct-foreign', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as { enabled: boolean };
      puts.push(body);
      state.enabled = body.enabled;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        enabled: state.enabled,
        foreignRouteReady: state.ready,
        rules: state.rules ?? [],
      }),
    });
  });
  return puts;
}

test.describe('Direct foreign mode', () => {
  test('requires an explicit acknowledgement before bypassing the VPN, then restores it', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Direct Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    const puts = await mockApi(context, { enabled: false, ready: true });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByText('VPN routing', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /bypass the vpn/i }).click();

    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Go direct' });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole('checkbox').check();
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByText('Direct', { exact: true })).toBeVisible();
    expect(puts).toEqual([{ enabled: true, acknowledge: true }]);

    await page.getByRole('button', { name: 'Restore VPN routing' }).click();
    await expect(page.getByText('VPN routing', { exact: true })).toBeVisible();
    expect(puts).toEqual([
      { enabled: true, acknowledge: true },
      { enabled: false, acknowledge: false },
    ]);
  });

  test('warns when the foreign link has no default route', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Direct Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockApi(context, { enabled: false, ready: false });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByText('Foreign link has no default route')).toBeVisible();
    await expect(page.getByRole('button', { name: /bypass the vpn/i })).toBeEnabled();
  });

  test('stays hidden while the VPN is up', async ({ page, context, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Direct Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockApi(context, { enabled: false, ready: true, vpnDown: false });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByRole('img', { name: 'Routing topology' })).toBeVisible();
    await expect(page.getByText('Direct foreign mode')).toHaveCount(0);
  });

  test('offers the restore action while only some rules are on', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Direct Router', host: '10.0.0.10' });
    await seedCredentials(context, ROUTER_ID);
    await mockApi(context, {
      enabled: false,
      ready: true,
      vpnDown: false,
      rules: [
        { id: '*1', comment: 'a', disabled: false },
        { id: '*2', comment: 'b', disabled: true },
      ],
    });

    await page.goto(`/router/${ROUTER_ID}/internet`);

    await expect(page.getByRole('button', { name: 'Restore VPN routing' })).toBeVisible();
  });
});
