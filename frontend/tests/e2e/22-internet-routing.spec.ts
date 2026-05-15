import { test, expect } from './fixtures';

test.describe('Internet routing page', () => {
  test('renders topology with active hops and detached WAN', async ({
    page,
    resetMocks,
    seedRouter,
    seedRoutingTopology,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_net', name: 'Net Router' });
    await seedRoutingTopology({
      routerId: 'rtr_net',
      nodes: [
        { id: 'grp_home', kind: 'group', label: 'Home', subnet: '192.168.88.0/24' },
        { id: 'rtr', kind: 'router', label: 'Router' },
        { id: 'wan_starlink', kind: 'wan', label: 'Starlink', wanKind: 'starlink' },
        { id: 'wan_irancell', kind: 'wan', label: 'Irancell', wanKind: 'mobile' },
        { id: 'vpn_wg', kind: 'vpn', label: 'wg-mask', protocol: 'wireguard' },
      ],
      hops: [
        { id: 'h_home_rtr', fromId: 'grp_home', toId: 'rtr', isActive: true },
        { id: 'h_rtr_starlink', fromId: 'rtr', toId: 'wan_starlink', isActive: true },
        { id: 'h_starlink_wg', fromId: 'wan_starlink', toId: 'vpn_wg', isActive: true },
      ],
    });

    await page.goto('/router/rtr_net/internet');

    await expect(page.getByRole('heading', { name: /internet routing/i })).toBeVisible();
    await expect(page.getByText('Home', { exact: true })).toBeVisible();
    await expect(page.getByText('Starlink', { exact: true })).toBeVisible();
    await expect(page.getByText('Irancell', { exact: true })).toBeVisible();
    await expect(page.getByText('wg-mask', { exact: true })).toBeVisible();

    const svg = page.getByRole('img', { name: 'Routing topology' });
    await expect(svg).toBeVisible();

    const activePath = svg.locator('path#edge-h_rtr_starlink');
    await expect(activePath).toHaveCount(1);

    const dots = svg.locator('circle animateMotion');
    expect(await dots.count()).toBeGreaterThan(0);

    await expect(svg.locator('path#edge-h_rtr_irancell')).toHaveCount(0);
  });

  test('Internet tab is enabled', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_tabs', name: 'Tabs Router' });
    await page.goto('/router/rtr_tabs');

    const tab = page.getByRole('tab', { name: /internet/i });
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
    await tab.click();
    await expect(page).toHaveURL(/\/router\/rtr_tabs\/internet$/);
  });
});
