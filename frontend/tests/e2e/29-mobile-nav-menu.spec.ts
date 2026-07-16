import { test, expect } from './fixtures';

test.describe('Mobile navigation menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('folds the section tab bar into the header hamburger menu', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_mob',
      name: 'Mobile Router',
      host: '10.0.0.60',
      model: 'hAP ax3',
      version: '7.13.2',
    });
    await mockOverviewBackend({ id: 'rtr_mob', model: 'hAP ax3', version: '7.13.2' });
    await page.goto('/router/rtr_mob');

    // The section tab bar is folded away on mobile.
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toBeHidden();

    const trigger = page.locator('header button[aria-haspopup="menu"]');
    await expect(trigger).toBeVisible();
    await expect(trigger.locator('[role="status"]')).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Opening the menu reveals both the router sections and the session actions.
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Internet' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /updates & notifications/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();

    // Selecting a section navigates and folds the menu away.
    await page.getByRole('menuitem', { name: 'Help' }).click();
    await expect(page).toHaveURL(/\/router\/rtr_mob\/help$/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes the menu on Escape', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_mob2', name: 'Mobile Router 2', host: '10.0.0.61' });
    await mockOverviewBackend({ id: 'rtr_mob2' });
    await page.goto('/router/rtr_mob2');

    const trigger = page.locator('header button[aria-haspopup="menu"]');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
