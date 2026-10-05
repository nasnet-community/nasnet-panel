import { test, expect, type TestFixtures } from './fixtures';

const seedHeaderRouter = async ({
  resetMocks,
  seedRouter,
  mockOverviewBackend,
}: Pick<TestFixtures, 'resetMocks' | 'seedRouter' | 'mockOverviewBackend'>) => {
  await resetMocks();
  await seedRouter({
    id: 'rtr_lang',
    name: 'Language Router',
    host: '10.0.0.60',
    model: 'hAP ax3',
    version: '7.13.2',
  });
  await mockOverviewBackend({ id: 'rtr_lang', model: 'hAP ax3', version: '7.13.2' });
};

test.describe('Language switch', () => {
  test('switches to Farsi right to left and persists across reloads', async ({
    page,
    resetMocks,
  }) => {
    await resetMocks();
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('dir', 'ltr');

    await page.getByRole('button', { name: 'فارسی' }).click();
    await expect(html).toHaveAttribute('lang', 'fa');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: /حالت روشن/ })).toBeVisible();

    await page.reload();
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: 'فارسی' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'English' }).click();
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('button', { name: /light mode (on|off)/i })).toBeVisible();
  });

  test('translates the header menu and offers Persian digits only in Farsi', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await seedHeaderRouter({ resetMocks, seedRouter, mockOverviewBackend });
    await page.goto('/router/rtr_lang');

    const trigger = page.locator('header button[aria-haspopup="menu"]');
    await trigger.click();
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Persian digits' })).toHaveCount(0);

    await page.getByRole('button', { name: 'فارسی' }).click();
    await expect(page.getByRole('menuitem', { name: 'خروج' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'نمای کلی' }).first()).toBeAttached();

    const digits = page.getByRole('checkbox', { name: 'ارقام فارسی' });
    await expect(digits).not.toBeChecked();
    await digits.check();

    await page.reload();
    await trigger.click();
    await expect(page.getByRole('checkbox', { name: 'ارقام فارسی' })).toBeChecked();
  });
});

test.describe('Language detection', () => {
  test.use({ locale: 'fa-IR' });

  test('defaults to Farsi when the browser prefers it', async ({ page, resetMocks }) => {
    await resetMocks();
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: 'فارسی' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
