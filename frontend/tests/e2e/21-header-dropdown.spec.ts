import { test, expect } from './fixtures';

test.describe('Header dropdown', () => {
  test('shows router name on trigger and reveals theme + session actions', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_hdr',
      name: 'Header Router',
      host: '10.0.0.50',
      model: 'hAP ax3',
      version: '7.13.2',
    });
    await mockOverviewBackend({ id: 'rtr_hdr', model: 'hAP ax3', version: '7.13.2' });
    await page.goto('/router/rtr_hdr');

    const trigger = page.locator('header button[aria-haspopup="menu"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText('Header Router');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger.locator('[role="status"]')).toBeVisible();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('menuitem', { name: /updates & notifications/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();
    await expect(page.getByRole('switch', { name: /toggle light mode/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Light$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Dark$/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
