import type { Page, Route } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_dns_static';

const envelope = <T>(data: T, status = 200) => JSON.stringify({ status, message: 'OK', data });

interface Entry {
  id: string;
  name: string;
  address: string;
  type: string;
  ttl: string;
  disabled: boolean;
}

interface Call {
  method: string;
  path: string;
  body: unknown;
}

// Serves the static DNS endpoints from an in-memory list and records every
// write so a test can assert what the page sent.
async function mockStaticDns(page: Page, initial: Entry[]) {
  const entries = [...initial];
  const calls: Call[] = [];
  let nextId = 100;

  const handle = async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/dns/static') {
      await route.fulfill({ contentType: 'application/json', body: envelope(entries) });
      return;
    }
    const body = request.postData() ? request.postDataJSON() : null;
    calls.push({ method, path, body });
    if (method === 'POST') {
      const created = {
        id: `*${nextId++}`,
        type: 'A',
        ttl: '1d',
        disabled: false,
        ...(body as { name: string; address: string }),
      };
      entries.push(created);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: envelope(created, 201),
      });
      return;
    }
    const id = decodeURIComponent(path.split('/').pop() ?? '');
    const index = entries.findIndex((e) => e.id === id);
    if (index < 0) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, message: 'Static DNS entry not found' }),
      });
      return;
    }
    if (method === 'PUT') {
      entries[index] = { ...entries[index], ...(body as Partial<Entry>) };
      await route.fulfill({ contentType: 'application/json', body: envelope(entries[index]) });
      return;
    }
    entries.splice(index, 1);
    await route.fulfill({ status: 204, body: '' });
  };

  await page.route('**/api/dns/static', handle);
  await page.route('**/api/dns/static/*', handle);
  return calls;
}

const nas: Entry = {
  id: '*1',
  name: 'nas.lan',
  address: '192.168.88.10',
  type: 'A',
  ttl: '1d',
  disabled: false,
};

test.describe('DNS page static entries', () => {
  test.beforeEach(async ({ resetMocks, seedRouter, mockOverviewBackend, mockDnsBackend }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'DNS Router', host: '10.20.30.1', model: 'hAP ax3' });
    await mockOverviewBackend({ id: ROUTER_ID, model: 'hAP ax3' });
    await mockDnsBackend({ id: ROUTER_ID });
  });

  test('shows an empty state when there are no entries', async ({ page }) => {
    await mockStaticDns(page, []);
    await page.goto(`/router/${ROUTER_ID}/dns`);

    const card = page.getByTestId('static-dns-card');
    await expect(card).toContainText('No static DNS entries yet.');
  });

  test('adds an entry and validates the form first', async ({ page }) => {
    const calls = await mockStaticDns(page, []);
    await page.goto(`/router/${ROUTER_ID}/dns`);

    const card = page.getByTestId('static-dns-card');
    await card.getByRole('button', { name: 'Add entry' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add static DNS entry' })).toBeVisible();
    await dialog.getByLabel('Name').fill('bad name');
    await dialog.getByLabel('IPv4 address').fill('2001:db8::1');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toContainText('Use up to 253 letters');
    await expect(dialog).toContainText('Enter a valid IPv4 address.');
    expect(calls).toHaveLength(0);

    await dialog.getByLabel('Name').fill(' printer.lan ');
    await dialog.getByLabel('IPv4 address').fill('192.168.88.20');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(calls).toEqual([
      {
        method: 'POST',
        path: '/api/dns/static',
        body: { name: 'printer.lan', address: '192.168.88.20' },
      },
    ]);
    await expect(card.getByRole('row', { name: /printer\.lan/ })).toContainText('192.168.88.20');
  });

  test('edits an entry by id', async ({ page }) => {
    const calls = await mockStaticDns(page, [nas]);
    await page.goto(`/router/${ROUTER_ID}/dns`);

    const row = page.getByRole('row', { name: /nas\.lan/ });
    await row.getByRole('button', { name: 'Edit nas.lan' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Edit static DNS entry' })).toBeVisible();
    await expect(dialog.getByLabel('Name')).toHaveValue('nas.lan');
    await dialog.getByLabel('IPv4 address').fill('192.168.88.11');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    expect(calls).toEqual([
      {
        method: 'PUT',
        path: '/api/dns/static/*1',
        body: { name: 'nas.lan', address: '192.168.88.11' },
      },
    ]);
    await expect(row).toContainText('192.168.88.11');
  });

  test('toggles an entry off', async ({ page }) => {
    const calls = await mockStaticDns(page, [nas]);
    await page.goto(`/router/${ROUTER_ID}/dns`);

    const toggle = page.getByRole('switch', { name: 'Enable nas.lan' });
    await expect(toggle).toBeChecked();
    await toggle.click();

    await expect(toggle).not.toBeChecked();
    expect(calls).toEqual([
      { method: 'PUT', path: '/api/dns/static/*1', body: { disabled: true } },
    ]);
  });

  test('deletes an entry after confirm', async ({ page }) => {
    const calls = await mockStaticDns(page, [nas]);
    await page.goto(`/router/${ROUTER_ID}/dns`);

    await page.getByRole('button', { name: 'Delete nas.lan' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Delete static DNS entry' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('row', { name: /nas\.lan/ })).toBeHidden();
    expect(calls).toEqual([{ method: 'DELETE', path: '/api/dns/static/*1', body: null }]);
  });

  test('keeps the dialog open and shows the backend error when adding fails', async ({ page }) => {
    await mockStaticDns(page, []);
    await page.route('**/api/dns/static', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ status: 400, message: 'Invalid name', error: 'Invalid name' }),
      });
    });
    await page.goto(`/router/${ROUTER_ID}/dns`);

    await page.getByRole('button', { name: 'Add entry' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add static DNS entry' })).toBeVisible();
    await dialog.getByLabel('Name').fill('nas.lan');
    await dialog.getByLabel('IPv4 address').fill('192.168.88.10');
    await dialog.getByRole('button', { name: 'Save' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toContainText('Failed to add static DNS entry');
    await expect(dialog).toBeVisible();
  });

  test('switching routers clears the previous router entries', async ({
    page,
    seedRouter,
    mockDnsBackend,
  }) => {
    const OTHER_ID = 'rtr_dns_static_other';
    await seedRouter({ id: OTHER_ID, name: 'Other Router', host: '10.20.30.2', model: 'hAP ax3' });
    await mockDnsBackend({ id: OTHER_ID });

    let releaseOther: () => void = () => {};
    const otherPending = new Promise<void>((resolve) => {
      releaseOther = resolve;
    });
    await page.route('**/api/dns/static', async (route) => {
      const host = route.request().headers()['x-routeros-host'];
      if (host === '10.20.30.2') {
        await otherPending;
        await route.fulfill({
          contentType: 'application/json',
          body: envelope([{ ...nas, id: '*9', name: 'other.lan', address: '10.0.0.9' }]),
        });
        return;
      }
      await route.fulfill({ contentType: 'application/json', body: envelope([nas]) });
    });

    await page.goto(`/router/${ROUTER_ID}/dns`);
    const card = page.getByTestId('static-dns-card');
    await expect(card.getByText('nas.lan')).toBeVisible();

    // Client-side navigation, so the DNS page stays mounted like it does in the app.
    await page.evaluate((id) => {
      window.history.pushState({}, '', `/router/${id}/dns`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, OTHER_ID);

    await expect(card.getByText('nas.lan')).toHaveCount(0);
    releaseOther();
    await expect(card.getByText('other.lan')).toBeVisible();
  });
});
