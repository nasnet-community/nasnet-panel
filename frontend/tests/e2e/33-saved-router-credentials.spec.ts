import { test, expect } from './fixtures';

test.describe('Saved router credentials prompt', () => {
  test('prompts for credentials and loads the dashboard after connect', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_saved',
      name: 'Saved Router',
      host: '10.0.0.50',
      hostname: 'saved-router.home.',
    });
    await mockOverviewBackend({ model: 'hAP ax3', version: '7.14' });
    await page.goto('/router/rtr_saved');

    const dialog = page.getByRole('dialog', { name: /connect to saved router/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Username')).toHaveValue('admin');
    await dialog.getByLabel('Password', { exact: true }).fill('test');
    await dialog.getByRole('button', { name: 'Connect' }).click();

    await expect(page.getByRole('heading', { name: 'Resources', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  });

  test('cancel returns to the router list', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_saved2', name: 'Saved Router Two', host: '10.0.0.51' });
    await mockOverviewBackend({ model: 'hAP ax3', version: '7.14' });
    await page.goto('/router/rtr_saved2');

    const dialog = page.getByRole('dialog', { name: /connect to saved router two/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /new router/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
