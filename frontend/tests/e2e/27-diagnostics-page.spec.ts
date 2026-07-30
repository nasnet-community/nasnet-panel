import { test, expect } from './fixtures';

test.describe('Diagnostics page', () => {
  test('runs a diagnostic, ticks the timeline, and downloads the report', async ({
    page,
    resetMocks,
    seedRouter,
    mockDiagBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_diag', name: 'Diag Router', host: '10.10.10.2' });
    await mockDiagBackend({ id: 'rtr_diag' });
    await page.goto('/router/rtr_diag/diagnostics');

    await expect(page.getByText('System info')).toBeVisible();
    await expect(page.getByText('Connectivity tests')).toBeVisible();
    await expect(page.getByText('nasnet-diagnostic-report.txt')).toHaveCount(0);

    const startButton = page.getByRole('button', { name: /^start$/i });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page.getByRole('button', { name: /running/i })).toBeVisible();

    await expect(page.getByText('nasnet-diagnostic-report.txt')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Generated 2026-07-08 01:36:16 (74.15 KB)')).toBeVisible();
    await expect(page.getByRole('button', { name: /run again/i })).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^download$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('nasnet-diagnostic-report.txt');
  });

  test('shows an existing report on load and opens help via talk to support', async ({
    page,
    resetMocks,
    seedRouter,
    mockDiagBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_diag2', name: 'Diag Router 2', host: '10.10.10.3' });
    await mockDiagBackend({ id: 'rtr_diag2', initialProgress: 100 });
    await page.goto('/router/rtr_diag2/diagnostics');

    await expect(page.getByText('nasnet-diagnostic-report.txt')).toBeVisible();
    await expect(page.getByText('Generated 2026-07-08 01:36:16 (74.15 KB)')).toBeVisible();
    await expect(page.getByRole('button', { name: /run again/i })).toBeEnabled();

    await page.getByRole('button', { name: /talk to support/i }).click();
    await expect(page).toHaveURL(/\/router\/rtr_diag2\/help$/);
  });

  test('opens the setup wizard via reset and reconfigure', async ({
    page,
    resetMocks,
    seedRouter,
    mockDiagBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_diag3', name: 'Diag Router 3', host: '10.10.10.4' });
    await mockDiagBackend({ id: 'rtr_diag3' });
    await page.goto('/router/rtr_diag3/diagnostics');

    await expect(page.getByText('Reset Configuration')).toBeVisible();
    await page.getByRole('button', { name: /reset and reconfigure/i }).click();
    await expect(page).toHaveURL(/\/router\/rtr_diag3\/config$/);
  });
});
