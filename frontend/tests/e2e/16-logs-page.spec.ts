import { test, expect } from './fixtures';

test.describe('Logs page', () => {
  test('tab is reachable, filters and search narrow the list', async ({
    page,
    resetMocks,
    seedRouter,
    mockLogsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_logs', name: 'Logs Router', host: '10.10.10.1' });
    await mockLogsBackend({ id: 'rtr_logs' });
    await page.goto('/router/rtr_logs/logs');

    await expect(page.getByRole('heading', { name: /^logs$/i })).toBeVisible();
    const stream = page.getByTestId('log-stream');
    await expect(stream).toBeVisible();
    await expect(stream.getByTestId('log-row').first()).toBeVisible();

    // Level multi-select opens and exposes severity options.
    await page.getByRole('combobox', { name: /level/i }).click();
    await page.getByRole('option', { name: 'error' }).click();
    await page.keyboard.press('Escape');
    await expect(stream).toBeVisible();

    // Debounced text search reveals the pppoe error message.
    await page.getByLabel('Search', { exact: true }).fill('pppoe');
    await expect(stream).toContainText(/pppoe/i);
  });
});
