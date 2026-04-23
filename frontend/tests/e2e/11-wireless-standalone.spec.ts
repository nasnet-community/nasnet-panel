import { test, expect } from './fixtures';

test.describe('Wireless standalone', () => {
  test('edit and persist passphrase via edit dialog', async ({
    page,
    resetMocks,
    seedRouter,
    mockWifiBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_wire', name: 'Wireless Router' });
    await mockWifiBackend({ id: 'rtr_wire' });
    await page.goto('/router/rtr_wire/wireless');

    await page.getByRole('button', { name: /^edit$/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const pw = page.getByLabel('Password', { exact: true });
    await expect(page.getByLabel('SSID')).toBeVisible();
    await pw.fill('newpass123');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/wireless settings saved/i)).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /^edit$/i }).click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('newpass123');
  });
});
