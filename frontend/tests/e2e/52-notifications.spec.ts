import type { BrowserContext } from '@playwright/test';
import { test, expect } from './fixtures';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

async function signIn(context: BrowserContext) {
  await context.addInitScript((routerId: string) => {
    try {
      window.sessionStorage.setItem(
        'nasnet-panel.session-credentials.v1',
        JSON.stringify({ [routerId]: { username: 'admin', password: 'test' } }),
      );
      window.localStorage.setItem(
        'nasnet-panel.router-store.v1',
        JSON.stringify({
          routers: [{ id: routerId, name: 'Bell Router', host: '192.168.88.1' }],
          selectedRouterId: null,
          lastConnectedRouterId: routerId,
        }),
      );
    } catch {
      /* ignore */
    }
  }, 'rtr_bell');
}

// Serves the notification endpoints from an in-memory list and records the mark-read calls.
async function mockNotifications(context: BrowserContext, items: Notification[]) {
  const calls: string[] = [];
  const envelope = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 200, message: 'OK', data }),
  });
  await context.route('**/api/notifications', (route) => route.fulfill(envelope(items)));
  await context.route('**/api/notifications/read-all', (route) => {
    calls.push('read-all');
    items.forEach((n) => {
      n.read = true;
    });
    return route.fulfill(envelope(null));
  });
  await context.route('**/api/notifications/*/read', (route) => {
    const id = decodeURIComponent(route.request().url().split('/').slice(-2)[0]);
    calls.push(id);
    items.forEach((n) => {
      if (n.id === id) n.read = true;
    });
    return route.fulfill(envelope(null));
  });
  return calls;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

test.describe('Notifications', () => {
  test('bell shows unread count, previews the newest five and links to the page', async ({
    page,
    context,
    resetMocks,
  }) => {
    await resetMocks();
    await signIn(context);
    const items: Notification[] = Array.from({ length: 7 }, (_, i) => ({
      id: `n${i + 1}`,
      title: `Notice ${i + 1}`,
      message: `Details for notice ${i + 1}`,
      createdAt: minutesAgo(i * 10),
      read: i >= 3,
    }));
    const calls = await mockNotifications(context, items);

    await page.goto('/updates');
    const bell = page.getByRole('button', { name: /notifications, 3 unread/i });
    await expect(bell).toBeVisible();
    await expect(page.getByTestId('notifications-unread-count')).toHaveText('3');

    await bell.click();
    const panel = page.getByTestId('notifications-panel');
    await expect(panel.getByRole('listitem')).toHaveCount(5);
    await expect(panel.getByRole('listitem').first()).toContainText('Notice 1');
    await expect(panel).not.toContainText('Notice 6');

    await panel.getByRole('link', { name: 'View all' }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    const card = page.getByTestId('notifications-card');
    await expect(card.getByTestId('notification-row')).toHaveCount(7);
    await expect(card.getByTestId('notification-row').first()).toContainText('Notice 1');

    await card
      .getByTestId('notification-row')
      .filter({ hasText: 'Notice 2' })
      .getByRole('button', { name: 'Mark as read' })
      .click();
    await expect(page.getByTestId('notifications-unread-count')).toHaveText('2');
    expect(calls).toContain('n2');

    await page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(page.getByTestId('notifications-unread-count')).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Mark as read' })).toHaveCount(0);
    expect(calls).toContain('read-all');
  });

  test('a missing endpoint shows an empty state', async ({ page, context, resetMocks }) => {
    await resetMocks();
    await signIn(context);
    await context.route('**/api/notifications', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, message: 'Not Found' }),
      }),
    );

    await page.goto('/notifications');
    await expect(page.getByText('No notifications')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    await expect(page.getByTestId('notifications-unread-count')).toHaveCount(0);

    await page.getByRole('button', { name: 'Notifications', exact: true }).click();
    await expect(page.getByTestId('notifications-panel')).toContainText('No notifications');
    await expect(page.getByRole('status').filter({ hasText: /failed/i })).toHaveCount(0);
  });
});
