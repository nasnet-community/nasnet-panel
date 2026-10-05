import type { Page } from '@playwright/test';
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

const languageTrigger = (page: Page) => page.getByRole('button', { name: /^(Language|زبان): / });

const chooseLanguage = async (page: Page, nativeName: string) => {
  await languageTrigger(page).click();
  await page.getByRole('menuitemradio', { name: nativeName }).click();
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
    await expect(languageTrigger(page)).toHaveAttribute('aria-label', 'Language: English');

    await chooseLanguage(page, 'فارسی');
    await expect(html).toHaveAttribute('lang', 'fa');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('button', { name: /حالت روشن/ })).toBeVisible();

    await page.reload();
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(languageTrigger(page)).toHaveAttribute('aria-label', 'زبان: فارسی');

    await languageTrigger(page).click();
    await expect(page.getByRole('menuitemradio', { name: 'فارسی' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByRole('menuitemradio', { name: 'English' }).click();
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('button', { name: /light mode (on|off)/i })).toBeVisible();
  });

  test('translates the dashboard, keeps form fields left to right, and offers Persian digits', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await seedHeaderRouter({ resetMocks, seedRouter, mockOverviewBackend });
    await page.goto('/router/rtr_lang');

    await languageTrigger(page).click();
    await expect(page.getByRole('checkbox', { name: 'Persian digits' })).toHaveCount(0);
    await page.getByRole('menuitemradio', { name: 'فارسی' }).click();

    await expect(page.locator('header')).toContainText('نسنت پنل');
    await expect(page.getByRole('tab', { name: 'نمای کلی' }).first()).toBeAttached();
    await expect(page.getByRole('link', { name: 'مطالعهٔ راهنمای کاربر' })).toHaveAttribute(
      'href',
      'https://www.joinnasnet.com/fa/guides/nasnet-panel/overview/',
    );

    const routerMenu = page.locator('header button[aria-haspopup="menu"]');
    await routerMenu.click();
    await expect(page.getByRole('menuitem', { name: 'خروج' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'تغییر رمز عبور' }).click();
    const passwordField = page.locator('#change-password-new');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveCSS('direction', 'ltr');
    await page.keyboard.press('Escape');

    await languageTrigger(page).click();
    const digits = page.getByRole('checkbox', { name: 'ارقام فارسی' });
    await expect(digits).not.toBeChecked();
    await digits.check();

    await page.reload();
    await languageTrigger(page).click();
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
    await expect(languageTrigger(page)).toHaveAttribute('aria-label', 'زبان: فارسی');
  });
});
