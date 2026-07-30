import { test, expect } from './fixtures';

test.describe('Logo + favicon', () => {
  test('header logo image loads and favicon is served', async ({ page, resetMocks }) => {
    await resetMocks();
    await page.goto('/');
    const logo = page.getByRole('img', { name: /nasnet panel/i }).first();
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute('src');
    expect(src).toBe('/favicon.png');

    const logoRes = await page.request.get('/favicon.png');
    expect(logoRes.ok()).toBeTruthy();
    expect(logoRes.headers()['content-type']).toContain('image/png');
  });

  test('web app manifest and home screen icons are served', async ({ page, resetMocks }) => {
    await resetMocks();
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/apple-touch-icon.png',
    );

    const manifestRes = await page.request.get('/manifest.json');
    expect(manifestRes.ok()).toBeTruthy();
    const manifest = await manifestRes.json();
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      const iconRes = await page.request.get(icon.src);
      expect(iconRes.ok()).toBeTruthy();
      expect(iconRes.headers()['content-type']).toContain('image/png');
    }

    const appleRes = await page.request.get('/apple-touch-icon.png');
    expect(appleRes.ok()).toBeTruthy();
    expect(appleRes.headers()['content-type']).toContain('image/png');
  });
});
