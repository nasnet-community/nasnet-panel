import { test, expect } from './fixtures';

test.describe('Add router — manual credentials', () => {
  test('manual IP + credentials path lands on dashboard', async ({
    page,
    resetMocks,
    mockBackendScan,
  }) => {
    await resetMocks();
    await mockBackendScan();
    await page.goto('/routers/new');
    await expect(page).toHaveURL(/\/routers\/new/);

    await page.getByLabel(/display name/i).fill('Coffee Shop');
    await page.getByLabel(/ip address/i).fill('192.168.77.1');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/^password$/i).fill('letmein');
    await page.getByRole('button', { name: /^connect$/i }).click();

    await expect(page).toHaveURL(/\/router\/rtr_/);
    await expect(page.getByRole('heading', { name: 'Coffee Shop' })).toBeVisible();
  });
});
