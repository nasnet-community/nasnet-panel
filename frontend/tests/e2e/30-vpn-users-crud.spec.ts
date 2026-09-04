import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_vusers';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const baseUsers = [
  {
    id: '*1',
    name: 'alice',
    service: 'any',
    profile: 'VPN-VPN',
    password: 'alice123',
    disabled: false,
    limitBytesIn: 0,
    limitBytesOut: 0,
  },
  {
    id: '*2',
    name: 'bob',
    service: 'any',
    profile: 'branch-office',
    password: 'bob123',
    disabled: true,
    limitBytesIn: 0,
    limitBytesOut: 0,
    comment: 'suspended',
  },
];

const profiles = [
  { id: '*0', name: 'default', default: true },
  { id: '*1', name: 'VPN-VPN', default: false },
  { id: '*2', name: 'branch-office', default: false },
];

async function setup(
  context: import('@playwright/test').BrowserContext,
  resetMocks: () => Promise<void>,
  seedRouter: (input: { id: string; name: string; host: string }) => Promise<void>,
) {
  await resetMocks();
  await seedRouter({ id: ROUTER_ID, name: 'Users Router', host: '10.0.0.30' });

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

  await context.route('**/api/vpn/clients', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope([]) });
  });

  await context.route('**/api/vpn/servers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ ovpnServers: [], wireguards: [], pptp: null, l2tp: null, sstp: null }),
    });
  });

  await context.route('**/api/vpn/profiles', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(profiles) });
  });
}

test.describe('VPN users section', () => {
  test('lists users and creates one with VPN-VPN preselected', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await setup(context, resetMocks, seedRouter);

    let lastPostBody: {
      name?: string;
      password?: string;
      profile?: string;
      disabled?: boolean;
    } | null = null;
    await context.route('**/api/vpn/users', async (route) => {
      if (route.request().method() === 'POST') {
        lastPostBody = route.request().postDataJSON() as typeof lastPostBody;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: envelope({
            id: '*3',
            name: lastPostBody?.name,
            service: 'any',
            profile: lastPostBody?.profile,
            password: lastPostBody?.password,
            disabled: false,
            limitBytesIn: 0,
            limitBytesOut: 0,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(baseUsers),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    const aliceRow = page.getByRole('row', { name: /alice/ });
    await expect(aliceRow).toBeVisible();
    await expect(aliceRow.getByText('VPN-VPN')).toBeVisible();
    await expect(aliceRow.getByText('Enabled')).toBeVisible();

    const bobRow = page.getByRole('row', { name: /bob/ });
    await expect(bobRow.getByText('Disabled')).toBeVisible();
    await expect(bobRow.getByText('suspended')).toBeVisible();

    await page.getByRole('button', { name: 'Add user' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Profile' })).toContainText('VPN-VPN');

    await dialog.getByRole('combobox', { name: 'Profile' }).click();
    await expect(page.getByRole('option', { name: 'default' })).toHaveCount(0);
    await page.getByRole('option', { name: 'branch-office' }).click();

    await dialog.getByLabel('Name').fill('carol');
    await dialog.getByLabel('Password', { exact: true }).fill('carol123');
    await dialog.getByRole('button', { name: 'Create user' }).click();

    await expect
      .poll(() => lastPostBody)
      .toEqual({
        name: 'carol',
        password: 'carol123',
        profile: 'branch-office',
        disabled: false,
      });
    await expect(dialog).toBeHidden();
  });

  test('edits and deletes a user', async ({ page, context, resetMocks, seedRouter }) => {
    await setup(context, resetMocks, seedRouter);

    await context.route('**/api/vpn/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(baseUsers),
      });
    });

    let lastPutBody: {
      name?: string;
      password?: string;
      profile?: string;
      disabled?: boolean;
    } | null = null;
    let deletedUrl: string | null = null;
    await context.route('**/api/vpn/users/*', async (route) => {
      if (route.request().method() === 'PUT') {
        lastPutBody = route.request().postDataJSON() as typeof lastPutBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ ...baseUsers[1], disabled: false, password: 'bob45678' }),
        });
        return;
      }
      if (route.request().method() === 'DELETE') {
        deletedUrl = route.request().url();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope(null),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);

    await page.getByRole('button', { name: 'Edit bob' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Name')).toHaveValue('bob');

    await dialog.getByLabel('Password', { exact: true }).fill('bob45678');
    await dialog.getByRole('switch', { name: /enabled/i }).click();
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect.poll(() => lastPutBody).toEqual({ password: 'bob45678', disabled: false });
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Delete alice' }).click();
    await expect(page.getByText('Delete VPN user')).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect.poll(() => deletedUrl).toContain('/api/vpn/users/*1');
  });

  test('blocks a password shorter than 8 characters', async ({
    page,
    context,
    resetMocks,
    seedRouter,
  }) => {
    await setup(context, resetMocks, seedRouter);

    let posted = false;
    await context.route('**/api/vpn/users', async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: envelope({
            id: '*3',
            name: 'dave',
            service: 'any',
            profile: 'VPN-VPN',
            password: 'dave1234',
            disabled: false,
            limitBytesIn: 0,
            limitBytesOut: 0,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope(baseUsers),
      });
    });

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: 'Add user' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const password = dialog.getByLabel('Password', { exact: true });
    const submit = dialog.getByRole('button', { name: 'Create user' });
    await dialog.getByLabel('Name').fill('dave');
    await password.fill('short12');
    await password.press('Tab');

    await expect(dialog.getByText('Password must be at least 8 characters.')).toBeVisible();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(submit).toBeDisabled();
    expect(posted).toBe(false);

    await password.fill('dave1234');
    await expect(dialog.getByText('Password must be at least 8 characters.')).toBeHidden();
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect.poll(() => posted).toBe(true);
    await expect(dialog).toBeHidden();
  });
});
