import { test, expect } from './fixtures';

const ROUTER = { id: 'rtr_plugins', name: 'Plugins Router', host: '10.0.0.6' };

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const basePlugin = {
  version: '1.0.0',
  category: 'Proxy',
  url: 'https://example.com',
  icon: '',
  installed: false,
  running: false,
  installing: false,
  failed: false,
};

const CATALOG = [
  {
    ...basePlugin,
    id: 'xray-server',
    name: 'V2Ray / Xray',
    author: 'Project X',
    tagline: 'Self-hosted V2Ray/Xray proxy server.',
  },
  {
    ...basePlugin,
    id: 'ooni-probe',
    name: 'OONI Probe',
    author: 'OONI',
    category: 'Measurement',
    url: 'https://ooni.org',
    tagline: 'Measure internet censorship from your network.',
  },
];

test.describe('Plugins page', () => {
  test('Plugins tab navigates to the page and lists registry plugins', async ({
    context,
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await seedCredentials(ROUTER.id);
    await mockOverviewBackend({ id: ROUTER.id });

    await context.route('**/api/plugin/plugins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([CATALOG[0], { ...CATALOG[1], installed: true, running: true }]),
      });
    });

    await page.goto(`/router/${ROUTER.id}`);

    const pluginsTab = page.getByRole('tab', { name: 'Plugins' });
    await expect(pluginsTab).toBeEnabled();
    await pluginsTab.click();

    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/plugins$`));
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'V2Ray / Xray' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OONI Probe' })).toBeVisible();

    const ooniCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'OONI Probe' }) });
    await expect(ooniCard.getByText('running', { exact: true })).toBeVisible();
    await expect(ooniCard.getByRole('button', { name: /uninstall/i })).toBeVisible();

    const authorLink = ooniCard.getByRole('link', { name: 'OONI' });
    await expect(authorLink).toHaveAttribute('target', '_blank');
    await expect(authorLink).toHaveAttribute('rel', /noopener/);
    await expect(authorLink).toHaveAttribute('href', 'https://ooni.org');
  });

  test('install starts an async install, polls status, and refreshes the list', async ({
    context,
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await seedCredentials(ROUTER.id);

    let installed = false;

    await context.route('**/api/plugin/plugins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([{ ...CATALOG[0], installed, running: installed }, CATALOG[1]]),
      });
    });

    await context.route('**/api/plugin/install', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      installed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ id: 'xray-server', pluginId: 'xray-server' }),
      });
    });

    await context.route('**/api/plugin/status/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ pluginId: 'xray-server', phase: 'done' }),
      });
    });

    await page.goto(`/router/${ROUTER.id}/plugins`);

    const xrayCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'V2Ray / Xray' }) });
    await xrayCard.getByRole('button', { name: /^install$/i }).click();

    await expect(page.getByText('V2Ray / Xray installed')).toBeVisible();
    await expect(xrayCard.getByRole('button', { name: /uninstall/i })).toBeVisible();
  });

  test('install failure surfaces the error on the plugin without blocking others', async ({
    context,
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await seedCredentials(ROUTER.id);

    let failed = false;

    await context.route('**/api/plugin/plugins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([
          {
            ...CATALOG[0],
            installed: failed,
            failed,
            note: failed ? 'Errc: failed to pull image' : undefined,
          },
          CATALOG[1],
        ]),
      });
    });

    await context.route('**/api/plugin/install', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      failed = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({ id: 'xray-server', pluginId: 'xray-server' }),
      });
    });

    await context.route('**/api/plugin/status/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          pluginId: 'xray-server',
          phase: 'error',
          message: 'Errc: failed to pull image',
        }),
      });
    });

    await page.goto(`/router/${ROUTER.id}/plugins`);

    const xrayCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'V2Ray / Xray' }) });
    await xrayCard.getByRole('button', { name: /^install$/i }).click();

    await expect(page.getByText('V2Ray / Xray install failed')).toBeVisible();
    await expect(xrayCard.getByText('failed', { exact: true })).toBeVisible();
    await expect(xrayCard.getByText('Errc: failed to pull image')).toBeVisible();

    const ooniCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'OONI Probe' }) });
    await expect(ooniCard.getByRole('button', { name: /^install$/i })).toBeEnabled();
  });

  test('uninstall requires confirmation and surfaces cleanup warnings', async ({
    context,
    page,
    resetMocks,
    seedRouter,
    seedCredentials,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await seedCredentials(ROUTER.id);

    let installed = true;

    await context.route('**/api/plugin/plugins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope([{ ...CATALOG[0], installed, running: installed }, CATALOG[1]]),
      });
    });

    await context.route('**/api/plugin/plugin/*', async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      installed = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          id: 'xray-server',
          warnings: ['Failed to remove veth interface veth-xray'],
        }),
      });
    });

    await page.goto(`/router/${ROUTER.id}/plugins`);

    const xrayCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'V2Ray / Xray' }) });
    await xrayCard.getByRole('button', { name: /uninstall/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /uninstall/i })
      .click();

    await expect(page.getByText('V2Ray / Xray uninstalled with warnings')).toBeVisible();
    await expect(page.getByText('Failed to remove veth interface veth-xray')).toBeVisible();
    await expect(xrayCard.getByRole('button', { name: /^install$/i })).toBeVisible();
  });
});
