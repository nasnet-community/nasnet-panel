import { test, expect } from './fixtures';

test.describe('Theme toggle', () => {
  test('switches light/dark, persists across reloads', async ({ page, resetMocks }) => {
    await resetMocks();
    await page.goto('/');

    const toggle = page.getByRole('button', { name: /light mode (on|off)/i });
    await expect(toggle).toBeVisible();

    if ((await page.locator('html').getAttribute('data-theme')) !== 'light') {
      await toggle.click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
