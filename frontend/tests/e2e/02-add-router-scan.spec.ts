import { test, expect } from './fixtures';

test.describe('Add router — scan network', () => {
  test('scan finds devices and onboards a selected one', async ({
    page,
    resetMocks,
    mockBackendScan,
  }) => {
    await resetMocks();
    await mockBackendScan([
      {
        ip: '192.168.1.77',
        hostname: 'rb5009-demo',
        vendor: 'MikroTik',
        type: 'RB5009UG+S+IN',
      },
    ]);
    await page.goto('/');
    await page.getByRole('button', { name: /new router/i }).click();
    await expect(page).toHaveURL(/\/routers\/new/);
    await expect(page.getByRole('heading', { name: /add router/i })).toBeVisible();

    const subnet = page.getByLabel(/subnet/i);
    await expect(subnet).toHaveValue('192.168.1.0/24');

    await page.getByRole('button', { name: /start scan/i }).click();

    const row = page.getByRole('row', { name: /RB5009UG\+S\+IN/ });
    await expect(row).toBeVisible();
    await row.click();

    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/^password$/i).fill('letmein');
    await page.getByRole('button', { name: /^connect$/i }).click();

    await expect(page).toHaveURL(/\/router\/rtr_/);
  });
});
