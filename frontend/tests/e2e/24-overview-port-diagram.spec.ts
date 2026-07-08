import { test, expect } from './fixtures';

test.describe('Overview tab — router port diagram + uplink IP', () => {
  test('renders per-port link status from interface state', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_pd', name: 'PD Router', host: '10.0.0.60', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_pd', model: 'hAP ax3' });

    await page.goto('/router/rtr_pd');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await expect(page.getByTestId('port-diagram')).toBeVisible();
    await expect(page.getByTestId('panel-model')).toHaveText('MikroTik hAP ax3');

    await expect(page.getByTestId('port-ether1')).toHaveAttribute('data-status', 'up');
    await expect(page.getByTestId('port-ether3')).toHaveAttribute('data-status', 'disabled');
    await expect(page.getByTestId('port-ether5')).toHaveAttribute('data-status', 'down');

    await expect(page.getByTestId('port-ether1')).toHaveAttribute(
      'aria-label',
      /ether1.*up.*100 MB.*50 MB/i,
    );
  });

  test('switches layout per model (RB5009 has 2.5G + SFP+, hAP ax2 has neither)', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_5009', name: '5009', host: '10.0.0.61', model: 'RB5009UG+S+IN' });
    await mockOverviewBackend({ id: 'rtr_5009', model: 'RB5009UG+S+IN' });

    await page.goto('/router/rtr_5009');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await expect(page.getByTestId('panel-model')).toHaveText('MikroTik RB5009UG+S+IN');
    await expect(page.getByTestId('port-ether8')).toBeVisible();
    await expect(page.getByTestId('port-sfp-sfpplus1')).toBeVisible();
  });

  test('hAP ax2 shows five ethernet ports and no SFP', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_ax2', name: 'ax2', host: '10.0.0.62', model: 'hAP ax2' });
    await mockOverviewBackend({ id: 'rtr_ax2', model: 'hAP ax2' });

    await page.goto('/router/rtr_ax2');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await expect(page.getByTestId('panel-model')).toHaveText('MikroTik hAP ax2');
    await expect(page.locator('[data-testid^="port-ether"]')).toHaveCount(5);
    await expect(page.locator('[data-testid^="port-sfp"]')).toHaveCount(0);
  });

  test('unknown model falls back to a supported model (never an arbitrary string)', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_ccr',
      name: 'CCR',
      host: '10.0.0.63',
      model: 'CCR2004-1G-12S+2XS',
    });
    await mockOverviewBackend({ id: 'rtr_ccr', model: 'CCR2004-1G-12S+2XS' });

    await page.goto('/router/rtr_ccr');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await expect(page.getByTestId('panel-model')).toHaveText('MikroTik hAP ax2');
    await expect(page.getByTestId('banner-model')).toHaveText('MikroTik hAP ax2');
    await expect(page.getByTestId('port-ether1')).toBeVisible();
  });

  test('uplink card lists WAN interface and IP', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_up', name: 'Uplink', host: '10.0.0.64', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_up', model: 'hAP ax3' });

    await page.goto('/router/rtr_up');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    const row = page.getByTestId('uplink-ether1');
    await expect(row).toBeVisible();
    await expect(row).toContainText('100.64.0.2/24');
  });

  test('degrades gracefully when ip endpoints return nothing', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_deg', name: 'Degraded', host: '10.0.0.65', model: 'hAP ax3' });
    await mockOverviewBackend({
      id: 'rtr_deg',
      model: 'hAP ax3',
      addresses: [],
    });

    await page.goto('/router/rtr_deg');
    await expect(page.getByTestId('overview-uptime')).not.toBeEmpty();

    await expect(page.getByTestId('port-diagram')).toBeVisible();
    await expect(page.getByTestId('uplink-card')).toBeVisible();
  });
});
