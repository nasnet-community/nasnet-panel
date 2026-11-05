import type { Page, Route } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_fw_domestic';

const envelope = <T>(data: T, status = 200) => JSON.stringify({ status, message: 'OK', data });
const failure = (status: number, message: string, error = '') =>
  JSON.stringify({ status, message, error });

interface Entry {
  id: string;
  address: string;
  timeout?: string;
  creationTime: string;
}

interface Call {
  method: string;
  path: string;
  body: unknown;
}

// Serves the firewall endpoints the page reads from an in-memory state and
// records every write so a test can assert what the page sent.
async function mockFirewall(
  page: Page,
  initial: { entries?: Entry[]; block?: boolean; rules?: unknown[] } = {},
) {
  const entries = [...(initial.entries ?? [])];
  const rules = initial.rules ?? [];
  let block = initial.block ?? false;
  const calls: Call[] = [];
  let nextId = 100;

  const blockState = () => ({
    block,
    rules: [
      { id: '*F1', chain: 'forward', disabled: !block },
      { id: '*F2', chain: 'output', disabled: !block },
    ],
  });

  await page.route('**/api/firewall/**', async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: envelope(data, status) });

    if (method === 'GET') {
      if (path === '/api/firewall/filter') return json(rules);
      if (path === '/api/firewall/domestic') return json(blockState());
      if (path === '/api/firewall/addresslist/domestic') return json(entries);
      if (path === '/api/firewall/addresslist/domestic/info') {
        return json({
          totalEntries: 1200 + entries.length,
          autoEntries: 1200,
          manualEntries: entries.length,
          lastUpdate: '2026-10-30 04:00:00',
        });
      }
      return route.fallback();
    }

    const body = request.postData() ? request.postDataJSON() : null;
    calls.push({ method, path, body });

    if (path === '/api/firewall/domestic') {
      block = (body as { block: boolean }).block;
      return json(blockState());
    }
    if (method === 'POST') {
      const { address } = body as { address: string };
      entries.push({ id: `*${nextId++}`, address, creationTime: '2026-11-02 10:00:00' });
      return json({ address }, 201);
    }
    const id = decodeURIComponent(path.split('/').pop() ?? '');
    const index = entries.findIndex((e) => e.id === id);
    if (method === 'PUT') {
      entries[index] = { ...entries[index], ...(body as Partial<Entry>) };
      return json(entries[index]);
    }
    entries.splice(index, 1);
    return json(undefined);
  });

  return calls;
}

const office: Entry = {
  id: '*1A',
  address: '203.0.113.0/24',
  creationTime: '2026-10-28 09:15:00',
};

test.describe('Firewall page domestic addresses', () => {
  test.beforeEach(async ({ context, resetMocks, seedRouter, mockOverviewBackend }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'FW Router', host: '10.0.0.20', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
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
  });

  test('the Firewall tab in the router menu opens the page', async ({ page }) => {
    await mockFirewall(page);
    await page.goto(`/router/${ROUTER_ID}`);

    await page.getByRole('tab', { name: 'Firewall' }).click();
    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER_ID}/firewall$`));
    await expect(page.getByTestId('domestic-addresses')).toBeVisible();
  });

  test('lists the filter rules', async ({ page }) => {
    await mockFirewall(page, {
      rules: [
        {
          id: '*2',
          chain: 'input',
          action: 'drop',
          protocol: 'tcp',
          dstPort: '22',
          disabled: false,
          log: false,
          comment: 'Block SSH from WAN',
        },
      ],
    });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    const row = page.getByRole('row', { name: /Block SSH from WAN/ });
    await expect(row).toContainText('input');
    await expect(row).toContainText('drop');
  });

  test('shows the list summary and the user-added addresses', async ({ page }) => {
    await mockFirewall(page, { entries: [office] });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    const side = page.getByTestId('domestic-block-card');
    await expect(side).toContainText('1,201');
    await expect(side).toContainText('2026-10-30 04:00:00');
    const card = page.getByTestId('domestic-addresses');
    const row = card.getByRole('row', { name: /203\.0\.113\.0\/24/ });
    await expect(row).toContainText('Never');
    await expect(
      page
        .getByTestId('domestic-block-card')
        .getByRole('switch', { name: 'Block traffic to domestic addresses' }),
    ).not.toBeChecked();
  });

  test('turning the block on asks first, turning it off does not', async ({ page }) => {
    const calls = await mockFirewall(page);
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    const toggle = page.getByRole('switch', { name: 'Block traffic to domestic addresses' });
    await toggle.click();
    const confirm = page.getByRole('dialog');
    await expect(
      confirm.getByRole('heading', { name: 'Block traffic to domestic addresses?' }),
    ).toBeVisible();
    expect(calls).toHaveLength(0);
    await confirm.getByRole('button', { name: 'Block' }).click();
    await expect(toggle).toBeChecked();

    await toggle.click();
    await expect(toggle).not.toBeChecked();
    expect(calls).toEqual([
      { method: 'PUT', path: '/api/firewall/domestic', body: { block: true } },
      { method: 'PUT', path: '/api/firewall/domestic', body: { block: false } },
    ]);
  });

  test('adds an address after validating it', async ({ page }) => {
    const calls = await mockFirewall(page);
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    const card = page.getByTestId('domestic-addresses');
    await card.getByRole('button', { name: 'Add address' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add domestic address' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Timeout' })).toHaveCount(0);

    const address = dialog.getByLabel('Address or range');
    for (const bad of ['0.0.0.0/0', '0.0.0.0/00', '2001:db8::/32', '10.0.0.300']) {
      await address.fill(bad);
      await dialog.getByRole('button', { name: 'Save' }).click();
      await expect(dialog).toContainText('Enter an IPv4 address or range');
    }
    expect(calls).toHaveLength(0);

    await address.fill(' 198.51.100.7 ');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    expect(calls).toEqual([
      {
        method: 'POST',
        path: '/api/firewall/addresslist/domestic',
        body: { address: '198.51.100.7' },
      },
    ]);
    await expect(card.getByRole('row', { name: /198\.51\.100\.7/ })).toBeVisible();
    await expect(page.getByTestId('domestic-block-card')).toContainText('1,201');
  });

  test('shows why an address is rejected and keeps the dialog open', async ({ page }) => {
    await mockFirewall(page, { entries: [office] });
    await page.route('**/api/firewall/addresslist/domestic', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: failure(
          409,
          'Address is already in the domestic address list',
          '203.0.113.9 is covered by 203.0.113.0/24',
        ),
      });
    });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    await page.getByRole('button', { name: 'Add address' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Address or range').fill('203.0.113.9');
    await dialog.getByRole('button', { name: 'Save' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Failed to add address');
    await expect(notifications).toContainText('203.0.113.9 is covered by 203.0.113.0/24');
    await expect(dialog).toBeVisible();
  });

  test('edits an address and its timeout', async ({ page }) => {
    const calls = await mockFirewall(page, { entries: [office] });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    await page.getByRole('button', { name: 'Edit 203.0.113.0/24' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Address or range')).toHaveValue('203.0.113.0/24');

    const timeout = dialog.getByRole('combobox', { name: 'Timeout' });
    await expect(timeout).toContainText('Keep current (never expires)');
    await dialog.getByLabel('Address or range').fill('203.0.113.0/25');
    await timeout.click();
    await page.getByRole('option', { name: '7 days' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    expect(calls).toEqual([
      {
        method: 'PUT',
        path: '/api/firewall/addresslist/domestic/*1A',
        body: { address: '203.0.113.0/25', timeout: '7d' },
      },
    ]);
    const row = page.getByRole('row', { name: /203\.0\.113\.0\/25/ });
    await expect(row).toContainText('7d');
  });

  test('editing without a timeout leaves it out of the request', async ({ page }) => {
    const calls = await mockFirewall(page, { entries: [office] });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    await page.getByRole('button', { name: 'Edit 203.0.113.0/24' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Address or range').fill('203.0.114.0/24');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    expect(calls[0].body).toEqual({ address: '203.0.114.0/24' });
  });

  test('deletes an address after confirm', async ({ page }) => {
    const calls = await mockFirewall(page, { entries: [office] });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    await page.getByRole('button', { name: 'Delete 203.0.113.0/24' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Delete domestic address' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('row', { name: /203\.0\.113\.0\/24/ })).toBeHidden();
    expect(calls).toEqual([
      { method: 'DELETE', path: '/api/firewall/addresslist/domestic/*1A', body: null },
    ]);
  });

  test('switching routers clears the previous router addresses and summary', async ({
    page,
    context,
    seedRouter,
  }) => {
    const OTHER_ID = 'rtr_fw_domestic_other';
    await seedRouter({ id: OTHER_ID, name: 'Other FW', host: '10.0.0.21', model: 'hAP ax3' });
    await context.addInitScript((routerId) => {
      const key = 'nasnet-panel.session-credentials.v1';
      const map = JSON.parse(window.sessionStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      map[routerId] = { username: 'admin', password: 'test' };
      window.sessionStorage.setItem(key, JSON.stringify(map));
    }, OTHER_ID);
    await mockFirewall(page, { entries: [office] });

    let releaseOther: () => void = () => {};
    const otherPending = new Promise<void>((resolve) => {
      releaseOther = resolve;
    });
    await page.route('**/api/firewall/addresslist/domestic**', async (route) => {
      if (route.request().headers()['x-routeros-host'] !== '10.0.0.21') return route.fallback();
      await otherPending;
      const path = new URL(route.request().url()).pathname;
      const data = path.endsWith('/info')
        ? { totalEntries: 7, autoEntries: 7, manualEntries: 0 }
        : [];
      await route.fulfill({ contentType: 'application/json', body: envelope(data) });
    });

    await page.goto(`/router/${ROUTER_ID}/firewall`);
    const card = page.getByTestId('domestic-addresses');
    const side = page.getByTestId('domestic-block-card');
    await expect(card.getByText('203.0.113.0/24')).toBeVisible();
    await expect(side).toContainText('1,201');

    // Client-side navigation, so the page stays mounted like it does in the app.
    await page.evaluate((id) => {
      window.history.pushState({}, '', `/router/${id}/firewall`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, OTHER_ID);

    await expect(card.getByText('203.0.113.0/24')).toHaveCount(0);
    await expect(side).not.toContainText('1,201');
    releaseOther();
    await expect(side).toContainText('Total entries');
    await expect(card).toContainText('No addresses added yet.');
  });

  test('explains when the block status cannot be loaded', async ({ page }) => {
    await mockFirewall(page);
    await page.route('**/api/firewall/domestic', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: failure(500, 'Failed to read domestic block rules', 'router timed out'),
      });
    });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    const side = page.getByTestId('domestic-block-card');
    await expect(side).toContainText('router timed out');
    await expect(
      side.getByRole('switch', { name: 'Block traffic to domestic addresses' }),
    ).toBeDisabled();
  });

  test('a double click on delete sends one request', async ({ page }) => {
    const calls = await mockFirewall(page, { entries: [office] });
    let deletes = 0;
    await page.route('**/api/firewall/addresslist/domestic/*', async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      deletes += 1;
      // Slow enough that the second click lands while the first delete is pending.
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fallback();
    });
    await page.goto(`/router/${ROUTER_ID}/firewall`);

    await page.getByRole('button', { name: 'Delete 203.0.113.0/24' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).dblclick();

    await expect(page.getByRole('row', { name: /203\.0\.113\.0\/24/ })).toBeHidden();
    expect(deletes).toBe(1);
    expect(calls).toHaveLength(1);
  });

  test('a late response from the previous router does not replace the summary', async ({
    page,
    context,
    seedRouter,
  }) => {
    const OTHER_ID = 'rtr_fw_domestic_late';
    await seedRouter({ id: OTHER_ID, name: 'Late FW', host: '10.0.0.22', model: 'hAP ax3' });
    await context.addInitScript((routerId) => {
      const key = 'nasnet-panel.session-credentials.v1';
      const map = JSON.parse(window.sessionStorage.getItem(key) ?? '{}') as Record<string, unknown>;
      map[routerId] = { username: 'admin', password: 'test' };
      window.sessionStorage.setItem(key, JSON.stringify(map));
    }, OTHER_ID);
    await mockFirewall(page, { entries: [office] });

    // Hold the first router's list until after the switch, so it answers last.
    let releaseFirst: () => void = () => {};
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    await page.route('**/api/firewall/addresslist/domestic**', async (route) => {
      const host = route.request().headers()['x-routeros-host'];
      if (host === '10.0.0.22') {
        const path = new URL(route.request().url()).pathname;
        const data = path.endsWith('/info')
          ? { totalEntries: 7, autoEntries: 7, manualEntries: 0 }
          : [];
        await route.fulfill({ contentType: 'application/json', body: envelope(data) });
        return;
      }
      await firstPending;
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/firewall`);
    const side = page.getByTestId('domestic-block-card');
    await expect(side.getByRole('switch')).toBeVisible();

    await page.evaluate((id) => {
      window.history.pushState({}, '', `/router/${id}/firewall`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, OTHER_ID);
    await expect(side).toContainText('Total entries');
    await expect(side.getByText('7', { exact: true }).first()).toBeVisible();

    releaseFirst();
    // Give the first router's response time to arrive and be ignored.
    await page.waitForTimeout(500);
    await expect(side).not.toContainText('1,201');
    await expect(page.getByTestId('domestic-addresses')).not.toContainText('203.0.113.0/24');
  });
});
