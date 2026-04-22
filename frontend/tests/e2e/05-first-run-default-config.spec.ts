import { test, expect } from './fixtures';

test.describe('First-run default configuration', () => {
  test('toast appears and configuration timestamp is visible afterward', async ({
    page,
    resetMocks,
    mockBackendScan,
  }) => {
    await resetMocks();
    await mockBackendScan();
    await page.goto('/routers/new');

    await page.getByLabel(/display name/i).fill('Freshly Added');
    await page.getByLabel(/ip address/i).fill('10.55.55.1');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/^password$/i).fill('letmein');
    await page.getByRole('button', { name: /^connect$/i }).click();

    await expect(page.getByText(/default configuration applied/i)).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_/);
  });
});
