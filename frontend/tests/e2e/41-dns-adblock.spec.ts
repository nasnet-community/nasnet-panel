import { test, expect } from './fixtures';

test.describe('DNS page ad-block', () => {
  test('explains what ad-block does and warns about broken sites', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_ab1', name: 'AdBlock Router', host: '10.20.0.1' });
    await mockOverviewBackend({ id: 'rtr_ab1' });
    await mockDnsBackend({ id: 'rtr_ab1' });

    await page.goto('/router/rtr_ab1/dns');

    const card = page.getByTestId('dns-adblock');
    await expect(card).toBeVisible();
    await expect(card).toContainText(/advertising and tracking domains/i);
    await expect(card).toContainText(/some websites stop working/i);

    const toggle = page.getByRole('switch', { name: 'Enable ad-block' });
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
  });

  test('turns ad-block on and keeps the toggle on after a reload', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_ab2', name: 'AdBlock Router', host: '10.20.0.2' });
    await mockOverviewBackend({ id: 'rtr_ab2' });
    await mockDnsBackend({ id: 'rtr_ab2' });

    const requests: Array<boolean | undefined> = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/dns/adblock')) {
        const body = req.postDataJSON() as { enabled?: boolean } | null;
        requests.push(body?.enabled);
      }
    });

    await page.goto('/router/rtr_ab2/dns');

    const toggle = page.getByRole('switch', { name: 'Enable ad-block' });
    await toggle.click();

    await expect(page.getByText('Ad-block enabled')).toBeVisible();
    await expect(toggle).toBeChecked();
    expect(requests).toEqual([true]);

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Enable ad-block' })).toBeChecked();
  });

  test('reconciles the toggle when the router is already in that state', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDnsBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_ab3', name: 'AdBlock Router', host: '10.20.0.3' });
    await mockOverviewBackend({ id: 'rtr_ab3' });
    await mockDnsBackend({ id: 'rtr_ab3', adBlockStatus: 409 });

    await page.goto('/router/rtr_ab3/dns');

    const toggle = page.getByRole('switch', { name: 'Enable ad-block' });
    await toggle.click();

    await expect(page.getByText('Ad-block was already on')).toBeVisible();
    await expect(page.getByText('Failed to update ad-block')).toHaveCount(0);
    await expect(toggle).toBeChecked();

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Enable ad-block' })).toBeChecked();
  });
});
