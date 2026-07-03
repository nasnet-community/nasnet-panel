import { test, expect } from './fixtures';

const ROUTER = { id: 'rtr_help', name: 'Help Router', host: '10.0.0.5' };

const GITHUB_ISSUES_URL = 'https://github.com/nasnet-community/nasnet-panel/issues/new';
const KNOWLEDGE_BASE_URL = 'https://docs.s4i.co/hc/nasnet/fa';

test.describe('Help page', () => {
  test('Help tab is enabled and navigates to the help page', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}`);

    const helpTab = page.getByRole('tab', { name: 'Help' });
    await expect(helpTab).toBeEnabled();
    await helpTab.click();

    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/help$`));
    await expect(page.getByTestId('help-chat')).toBeVisible();
  });

  test('support buttons link to knowledge base, Telegram and GitHub in a new tab', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await page.goto(`/router/${ROUTER.id}/help`);

    const knowledgeBase = page.getByRole('link', { name: /knowledge base/i });
    await expect(knowledgeBase).toHaveAttribute('target', '_blank');
    await expect(knowledgeBase).toHaveAttribute('rel', /noopener/);
    await expect(knowledgeBase).toHaveAttribute('href', KNOWLEDGE_BASE_URL);

    const telegram = page.getByRole('link', { name: /telegram/i });
    await expect(telegram).toHaveAttribute('target', '_blank');
    await expect(telegram).toHaveAttribute('rel', /noopener/);
    await expect(telegram).toHaveAttribute('href', /^https:\/\/t\.me\//);

    const bug = page.getByRole('link', { name: /report a bug/i });
    await expect(bug).toHaveAttribute('target', '_blank');
    await expect(bug).toHaveAttribute('rel', /noopener/);
    await expect(bug).toHaveAttribute('href', GITHUB_ISSUES_URL);
  });
});
