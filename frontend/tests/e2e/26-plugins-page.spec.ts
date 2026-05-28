import { test, expect } from './fixtures';

const ROUTER = { id: 'rtr_plugins', name: 'Plugins Router', host: '10.0.0.6' };

test.describe('Plugins page', () => {
  test('Plugins tab navigates to the page and lists the catalog', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}`);

    const pluginsTab = page.getByRole('tab', { name: 'Plugins' });
    await expect(pluginsTab).toBeEnabled();
    await pluginsTab.click();

    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/plugins$`));
    await expect(page.getByRole('searchbox', { name: 'Search plugins' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(20);
    await expect(page.getByRole('heading', { name: 'Psiphon Conduit' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tor Bridge' })).toBeVisible();
  });

  test('search filters plugins by name', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}/plugins`);

    const search = page.getByRole('searchbox', { name: 'Search plugins' });
    await search.fill('psiphon');

    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Psiphon Conduit' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tor Bridge' })).toHaveCount(0);
  });

  test('search shows empty state when nothing matches', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}/plugins`);

    await page.getByRole('searchbox', { name: 'Search plugins' }).fill('zzzzzz');

    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByText(/no plugins match/i)).toBeVisible();
  });

  test('install button cycles through available, installing, and installed states', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}/plugins`);

    const torCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Tor Bridge' }) });
    const installButton = torCard.getByRole('button', { name: /install/i });

    await expect(installButton).toHaveText('Install');
    await installButton.click();
    await expect(installButton).toHaveText('Installed', { timeout: 5_000 });
    await expect(installButton).toBeDisabled();
  });

  test('author name links to the project site in a new tab', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}/plugins`);

    const onionShareCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'OnionShare' }) });
    const authorLink = onionShareCard.getByRole('link', { name: 'OnionShare' });

    await expect(authorLink).toHaveAttribute('target', '_blank');
    await expect(authorLink).toHaveAttribute('rel', /noopener/);
    await expect(authorLink).toHaveAttribute('href', 'https://onionshare.org');
  });
});
