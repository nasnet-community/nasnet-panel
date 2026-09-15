import { test, expect } from './fixtures';

test.describe('Diagnostics cable test', () => {
  test('runs a cable test on an ethernet interface and shows per-pair results', async ({
    page,
    resetMocks,
    seedRouter,
    mockDiagBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_cable', name: 'Cable Router', host: '10.10.20.2' });
    await mockDiagBackend({ id: 'rtr_cable' });
    await page.goto('/router/rtr_cable/diagnostics');

    await expect(page.getByText('Cable Test', { exact: true })).toBeVisible();
    const picker = page.getByRole('combobox', { name: /ethernet interface/i });
    await expect(picker).toHaveText('ether1');

    await picker.click();
    await page.getByRole('option', { name: 'ether2' }).click();
    await expect(picker).toHaveText('ether2');

    await page.getByRole('button', { name: /run cable test/i }).click();
    await expect(page.getByRole('button', { name: /testing/i })).toBeDisabled();

    await expect(page.getByText('no-link')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pair 1' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pair 4' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'open' })).toHaveCount(2);
    await expect(page.getByRole('cell', { name: 'normal' })).toHaveCount(2);
    await expect(page.getByRole('cell', { name: '3 m' })).toHaveCount(2);

    await picker.click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await page.getByRole('button', { name: /run cable test/i }).click();
    await expect(page.getByText('link-ok')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pair 1' })).toHaveCount(0);
  });

  test('shows an error when the cable test fails', async ({
    page,
    resetMocks,
    seedRouter,
    mockDiagBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_cable2', name: 'Cable Router 2', host: '10.10.20.3' });
    await mockDiagBackend({ id: 'rtr_cable2', cableTestFails: true });
    await page.goto('/router/rtr_cable2/diagnostics');

    await expect(page.getByRole('combobox', { name: /ethernet interface/i })).toHaveText('ether1');
    await page.getByRole('button', { name: /run cable test/i }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: /failed to test cable/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /run cable test/i })).toBeEnabled();
  });
});
