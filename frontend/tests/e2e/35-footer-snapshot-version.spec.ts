import { test, expect } from './fixtures';

const SNAPSHOT_SHA = '1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d';

const healthBody = (version: string) =>
  JSON.stringify({ status: 'healthy', server: 'nasnet-panel', version });

test.describe('Footer snapshot version', () => {
  test('shortens a snapshot commit sha', async ({ page, context, resetMocks }) => {
    await resetMocks();
    await context.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: healthBody(`dev-${SNAPSHOT_SHA}`),
      });
    });
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toContainText('Nasnet Panel dev-1a2b3c4');
    await expect(footer).not.toContainText(SNAPSHOT_SHA);
  });

  test('hides the placeholder version of an unstamped build', async ({
    page,
    context,
    resetMocks,
  }) => {
    await resetMocks();
    await context.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: healthBody('v0.0.0-dev'),
      });
    });
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toContainText('Nasnet Panel');
    await expect(footer).not.toContainText('v0.0.0-dev');
  });

  test('leaves a release version untouched', async ({ page, context, resetMocks }) => {
    await resetMocks();
    await context.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: healthBody('v1.4.2'),
      });
    });
    await page.goto('/');

    await expect(page.locator('footer')).toContainText('Nasnet Panel v1.4.2');
  });
});
