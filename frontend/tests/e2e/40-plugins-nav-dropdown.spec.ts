import { test, expect } from './fixtures';

const ROUTER = { id: 'rtr_plugnav', name: 'Plugin Nav Router', host: '10.0.0.7' };

const envelope = <T>(data: T) => JSON.stringify({ status: 200, message: 'OK', data });

const INSTALLED = [
  { id: 'ooni-probe', name: 'OONI Probe' },
  { id: 'xray-server', name: 'V2Ray / Xray' },
];

const basePlugin = {
  version: '1.0.0',
  category: 'Proxy',
  url: 'https://example.com',
  icon: '',
  canInstall: true,
  installed: true,
  running: true,
  installing: false,
  failed: false,
  author: 'Someone',
  tagline: 'A plugin.',
};

async function mockPlugins(
  context: import('@playwright/test').BrowserContext,
  installed: Array<{ id: string; name: string }>,
) {
  await context.route('**/api/plugin/installed', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(installed),
    });
  });
  await context.route('**/api/plugin/plugins', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(installed.map((p) => ({ ...basePlugin, ...p }))),
    });
  });
}

test.describe('Plugins nav dropdown', () => {
  test('Plugins tab stays a plain link when nothing is installed', async ({
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
    await mockPlugins(context, []);

    await page.goto(`/router/${ROUTER.id}`);

    await expect(page.getByRole('tab', { name: 'Plugins' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show Plugins menu' })).toHaveCount(0);
  });

  test('expands to the installed plugins and links to each plugin page', async ({
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
    await mockPlugins(context, INSTALLED);

    await page.goto(`/router/${ROUTER.id}`);

    const trigger = page.getByRole('button', { name: 'Show Plugins menu' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('menuitem', { name: 'OONI Probe' })).toHaveCount(0);

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const menu = page.getByRole('menu', { name: 'Plugins' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveCount(2);

    const ooni = menu.getByRole('menuitem', { name: 'OONI Probe' });
    await expect(ooni).toHaveAttribute('href', /\/api\/plugin\/view\/ooni-probe$/);
    await expect(ooni).toHaveAttribute('target', '_blank');
    await expect(menu.getByRole('menuitem', { name: 'V2Ray / Xray' })).toHaveAttribute(
      'href',
      /\/api\/plugin\/view\/xray-server$/,
    );

    // the open menu escapes the scrolling section bar
    const band = page.locator('[role="tablist"][aria-label="Router sections"]');
    const menuBox = await menu.boundingBox();
    const bandBox = await band.boundingBox();
    expect(menuBox!.y + menuBox!.height).toBeGreaterThan(bandBox!.y + bandBox!.height);

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('the parent tab still opens the Plugins overview', async ({
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
    await mockPlugins(context, INSTALLED);

    await page.goto(`/router/${ROUTER.id}`);

    await expect(page.getByRole('button', { name: 'Show Plugins menu' })).toBeVisible();
    await page.getByRole('tab', { name: 'Plugins' }).click();

    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/plugins$`));
    await expect(page.getByRole('heading', { name: 'OONI Probe' })).toBeVisible();
  });

  test.describe('on touch', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('opens from its own chevron, separate from the parent link', async ({
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
      await mockPlugins(context, INSTALLED);

      await page.goto(`/router/${ROUTER.id}`);

      await page.locator('header button[aria-haspopup="menu"]').click();

      const parent = page.getByRole('menuitem', { name: 'Plugins' });
      await expect(parent).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'OONI Probe' })).toHaveCount(0);

      const chevron = page.getByRole('button', { name: 'Show Plugins menu' });
      await chevron.click();
      await expect(chevron).toHaveAttribute('aria-expanded', 'true');

      const ooni = page.getByRole('menuitem', { name: 'OONI Probe' });
      await expect(ooni).toBeVisible();
      await expect(ooni).toHaveAttribute('href', /\/api\/plugin\/view\/ooni-probe$/);

      const ooniBox = await ooni.boundingBox();
      expect(ooniBox!.height).toBeGreaterThanOrEqual(44);

      await chevron.click();
      await expect(page.getByRole('menuitem', { name: 'OONI Probe' })).toHaveCount(0);

      await parent.click();
      await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/plugins$`));
    });
  });
});
