import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const ROUTER = { id: 'rtr_help', name: 'Help Router', host: '10.0.0.5' };

const GITHUB_ISSUES_URL = 'https://github.com/nasnet-community/nasnet-panel/issues/new';

async function mockChatwoot(page: Page) {
  const messages: Array<{ id: number; content: string; message_type: number }> = [];
  let nextId = 1;

  await page.route('**/public/api/v1/inboxes/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'POST' && /\/contacts$/.test(url.split('?')[0])) {
      return json({ source_id: 'contact-xyz', pubsub_token: 'pub-tok' });
    }
    if (method === 'POST' && /\/conversations$/.test(url.split('?')[0])) {
      return json({ id: 4242 });
    }
    if (method === 'POST' && /\/messages$/.test(url.split('?')[0])) {
      const sent = (req.postDataJSON() as { content?: string } | null)?.content ?? '';
      const userMsg = { id: nextId++, content: sent, message_type: 0 };
      messages.push(userMsg);
      messages.push({
        id: nextId++,
        content: 'Thanks, an agent will help shortly.',
        message_type: 1,
      });
      return json(userMsg);
    }
    if (method === 'GET' && /\/messages$/.test(url.split('?')[0])) {
      return json(messages);
    }
    return json({}, 200);
  });
}

test.describe('Help page', () => {
  test('Help tab is enabled and navigates to the help page', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await mockChatwoot(page);
    await page.goto(`/router/${ROUTER.id}`);

    const helpTab = page.getByRole('tab', { name: 'Help' });
    await expect(helpTab).toBeEnabled();
    await helpTab.click();

    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER.id}/help$`));
    await expect(page.getByTestId('help-chat')).toBeVisible();
  });

  test('AI chat sends a message and shows the agent reply', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await mockChatwoot(page);
    await page.goto(`/router/${ROUTER.id}/help`);

    const input = page.getByRole('textbox', { name: 'Message' });
    await input.fill('How do I reset my password?');
    await page.getByRole('button', { name: 'Send message' }).click();

    const chat = page.getByTestId('help-chat');
    await expect(chat).toContainText('How do I reset my password?');
    await expect(chat).toContainText('Thanks, an agent will help shortly.');
  });

  test('support buttons link to Telegram and GitHub in a new tab', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter(ROUTER);
    await mockChatwoot(page);
    await page.goto(`/router/${ROUTER.id}/help`);

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
