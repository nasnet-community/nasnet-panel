import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_sstp_disable';

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const SSTP = {
  port: 4433,
  protocol: 'tcp',
  localIp: '10.20.0.1',
  localIpPool: 'sstp-local-pool',
  remoteIp: '10.20.0.2-10.20.0.50',
  remoteIpPool: 'sstp-pool',
};

const seedSession = (routerId: string) => {
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
};

interface SstpMock {
  enabled: boolean;
  deleteUrls: string[];
  postBodies: (string | null)[];
}

const mockVpn = async (context: BrowserContext, initiallyEnabled: boolean) => {
  const state: SstpMock = { enabled: initiallyEnabled, deleteUrls: [], postBodies: [] };

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
        wireguards: [],
        pptp: null,
        l2tp: null,
        sstp: { ...SSTP, enabled: state.enabled },
      }),
    });
  });
  await context.route(
    (url) => url.pathname === '/api/vpn/sstp/server',
    async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        state.deleteUrls.push(route.request().url());
        state.enabled = false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ disabled: true, removedFirewallRules: 1 }),
        });
        return;
      }
      if (method === 'POST') {
        state.postBodies.push(route.request().postData());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: envelope({ taskId: 'sstp-task-43', status: 'running' }),
        });
        return;
      }
      await route.fallback();
    },
  );
  await context.route('**/api/vpn/sstp/server/status/sstp-task-43', async (route) => {
    state.enabled = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        taskId: 'sstp-task-43',
        status: 'completed',
        progress: 100,
        currentStep: 'Done',
        startTime: 0,
      }),
    });
  });

  return state;
};

test.describe('SSTP server enable and disable endpoints', () => {
  test.beforeEach(async ({ context, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'SSTP Router', host: '10.0.0.43' });
    await context.addInitScript(seedSession, ROUTER_ID);
  });

  test('enables the SSTP server without a request body', async ({ page, context }) => {
    const state = await mockVpn(context, false);

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    await page.getByRole('button', { name: 'Add server' }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('radiogroup', { name: 'VPN server type' })
      .getByRole('radio', { name: 'SSTP' })
      .click();
    await dialog.getByRole('button', { name: 'Enable SSTP server' }).click();

    await expect.poll(() => state.postBodies.length).toBe(1);
    expect(state.postBodies[0]).toBeNull();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('row', { name: /SSTP/ }).getByText('Running')).toBeVisible();
  });

  test('disables the SSTP server and keeps certificates by default', async ({ page, context }) => {
    const state = await mockVpn(context, true);

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    const row = page.getByRole('row', { name: /SSTP/ });
    await expect(row.getByText('Running')).toBeVisible();
    await row.getByRole('button', { name: /disable SSTP/i }).click();

    const confirm = page.getByRole('dialog');
    const checkbox = confirm.getByRole('checkbox', {
      name: 'Also delete certificates and their files from device storage',
    });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await confirm.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => state.deleteUrls.length).toBe(1);
    expect(new URL(state.deleteUrls[0]).searchParams.has('deleteCertificateFiles')).toBe(false);
    expect(state.postBodies).toHaveLength(0);
    await expect(page.getByRole('row', { name: /SSTP/ }).getByText('Disabled')).toBeVisible();
  });

  test('disables the SSTP server and deletes certificates when checked', async ({
    page,
    context,
  }) => {
    const state = await mockVpn(context, true);

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    const row = page.getByRole('row', { name: /SSTP/ });
    await expect(row.getByText('Running')).toBeVisible();
    await row.getByRole('button', { name: /disable SSTP/i }).click();

    const confirm = page.getByRole('dialog');
    await confirm
      .getByRole('checkbox', {
        name: 'Also delete certificates and their files from device storage',
      })
      .check();
    await confirm.getByRole('button', { name: 'Disable', exact: true }).click();

    await expect.poll(() => state.deleteUrls.length).toBe(1);
    expect(new URL(state.deleteUrls[0]).searchParams.get('deleteCertificateFiles')).toBe('true');
    await expect(page.getByRole('row', { name: /SSTP/ }).getByText('Disabled')).toBeVisible();
  });

  test('resets the certificate checkbox when the dialog is cancelled', async ({
    page,
    context,
  }) => {
    const state = await mockVpn(context, true);

    await page.goto(`/router/${ROUTER_ID}/vpn`);
    const row = page.getByRole('row', { name: /SSTP/ });
    await row.getByRole('button', { name: /disable SSTP/i }).click();

    const confirm = page.getByRole('dialog');
    const checkbox = confirm.getByRole('checkbox', {
      name: 'Also delete certificates and their files from device storage',
    });
    await checkbox.check();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();

    await row.getByRole('button', { name: /disable SSTP/i }).click();
    await expect(
      page.getByRole('dialog').getByRole('checkbox', {
        name: 'Also delete certificates and their files from device storage',
      }),
    ).not.toBeChecked();
    expect(state.deleteUrls).toHaveLength(0);
  });
});
