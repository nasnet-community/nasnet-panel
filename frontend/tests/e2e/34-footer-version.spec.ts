import { test, expect } from './fixtures';

test.describe('Footer version', () => {
  test('shows the backend-reported version', async ({ page, context, resetMocks }) => {
    await resetMocks();
    await context.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy', server: 'nasnet-panel', version: 'v9.9.9-e2e' }),
      });
    });
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('Nasnet Panel v9.9.9-e2e');
  });

  test('omits the version when the backend is unreachable', async ({
    page,
    context,
    resetMocks,
  }) => {
    await resetMocks();
    await context.route('**/health', (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('Nasnet Panel');
    await expect(page.locator('footer')).not.toContainText(/v\d/);
  });
});
