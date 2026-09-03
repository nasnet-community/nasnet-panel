import { test, expect } from './fixtures';

const freshStatus = JSON.stringify({
  status: 200,
  message: 'OK',
  data: { completed: false, progress: 0 },
});

test.describe('Wizard-gated navigation', () => {
  test('hides the tab bar and redirects to the wizard on a fresh router', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_fresh', name: 'Fresh Router', host: '10.0.0.70' });
    await mockOverviewBackend({ id: 'rtr_fresh' });
    await context.route('**/api/wizard/status', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: freshStatus });
    });

    await page.goto('/router/rtr_fresh');
    await expect(page).toHaveURL(/\/router\/rtr_fresh\/config$/);
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toHaveCount(0);

    await page.goto('/router/rtr_fresh/wan');
    await expect(page).toHaveURL(/\/router\/rtr_fresh\/config$/);
  });

  test('shows an unreachable notice instead of the wizard when the status check fails', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    context,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_err', name: 'Unreachable Router', host: '10.0.0.72' });
    await mockOverviewBackend({ id: 'rtr_err' });
    await context.route('**/api/wizard/status', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto('/router/rtr_err');
    await expect(page.getByRole('heading', { name: 'Router unreachable' })).toBeVisible();
    await expect(page).toHaveURL(/\/router\/rtr_err$/);
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toHaveCount(0);
  });

  test('shows the tab bar once the wizard has completed', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_done', name: 'Configured Router', host: '10.0.0.71' });
    await mockOverviewBackend({ id: 'rtr_done' });

    await page.goto('/router/rtr_done');
    await expect(page).toHaveURL(/\/router\/rtr_done$/);
    await expect(page.locator('[role="tablist"][aria-label="Router sections"]')).toBeVisible();
  });

  test.describe('mobile menu', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('hides the router sections on a fresh router', async ({
      page,
      resetMocks,
      seedRouter,
      mockOverviewBackend,
      context,
    }) => {
      await resetMocks();
      await seedRouter({ id: 'rtr_mfresh', name: 'Fresh Mobile', host: '10.0.0.73' });
      await mockOverviewBackend({ id: 'rtr_mfresh' });
      await context.route('**/api/wizard/status', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: freshStatus });
      });

      await page.goto('/router/rtr_mfresh');
      await expect(page).toHaveURL(/\/router\/rtr_mfresh\/config$/);

      const trigger = page.locator('header button[aria-haspopup="menu"]');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Overview' })).toHaveCount(0);
      await expect(page.getByRole('menuitem', { name: 'Wizard' })).toHaveCount(0);
    });
  });
});
