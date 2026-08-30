import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_conn';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

interface NetStatusEntry {
  host: string;
  status: string;
  since: string;
  type: 'foreign' | 'vpn' | 'domestic' | '';
}

const netProbe = (type: NetStatusEntry['type'], status: string): NetStatusEntry => ({
  host: type === 'foreign' ? '1.1.1.1' : type === 'vpn' ? '1.0.0.1' : '217.218.127.127',
  status,
  since: '2026-07-22 10:00:00',
  type,
});

async function mockNetStatus(context: BrowserContext, entries: NetStatusEntry[]) {
  await context.route('**/api/net/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(entries),
    });
  });
}

test.describe('Overview connectivity card', () => {
  test('renders a row per link with up badges when every probe is healthy', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Conn Router', host: '10.0.0.20' });
    await mockOverviewBackend({ id: ROUTER_ID });
    await mockNetStatus(context, [
      netProbe('foreign', 'up'),
      netProbe('domestic', 'up'),
      netProbe('vpn', 'up'),
    ]);

    await page.goto(`/router/${ROUTER_ID}`);

    const card = page.getByTestId('connectivity-card');
    await expect(card).toBeVisible();
    await expect(page.getByRole('region', { name: 'Connectivity' })).toBeVisible();

    for (const [type, label] of [
      ['foreign', 'Foreign'],
      ['domestic', 'Domestic'],
      ['vpn', 'VPN'],
    ] as const) {
      const row = page.getByTestId(`connectivity-${type}`);
      await expect(row).toBeVisible();
      await expect(row).toContainText(label);
      await expect(row).toContainText('UP');
      await expect(row).toContainText('Healthy');
    }
  });

  test('marks a failing probe as down and warning', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Conn Router', host: '10.0.0.20' });
    await mockOverviewBackend({ id: ROUTER_ID });
    await mockNetStatus(context, [
      netProbe('foreign', 'up'),
      netProbe('domestic', 'up'),
      netProbe('vpn', 'down'),
    ]);

    await page.goto(`/router/${ROUTER_ID}`);

    const vpnRow = page.getByTestId('connectivity-vpn');
    await expect(vpnRow).toContainText('DOWN');
    await expect(vpnRow).toContainText('Warning');

    await expect(page.getByTestId('connectivity-foreign')).toContainText('Healthy');
    await expect(page.getByTestId('connectivity-domestic')).toContainText('Healthy');
  });

  test('keeps rows without data when the probe response is empty', async ({
    page,
    context,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Conn Router', host: '10.0.0.20' });
    await mockOverviewBackend({ id: ROUTER_ID });
    await mockNetStatus(context, []);

    await page.goto(`/router/${ROUTER_ID}`);

    await expect(page.getByTestId('connectivity-card')).toBeVisible();
    for (const type of ['foreign', 'domestic', 'vpn']) {
      await expect(page.getByTestId(`connectivity-${type}`)).toContainText('No data');
    }
  });
});
