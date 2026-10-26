import { test, expect } from './fixtures';

test.describe('Sortable tables', () => {
  test('clicking a column header sorts the DHCP leases and clicking again reverses it', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_sort', name: 'Sort Router', host: '10.10.10.9', model: 'hAP ax3' });
    await mockOverviewBackend({ id: 'rtr_sort', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_sort' });
    await page.goto('/router/rtr_sort/lan');

    const leases = page.getByTestId('dhcp-leases');
    const hostHeader = leases.getByRole('columnheader', { name: 'Host', exact: true });
    const hostRows = () => leases.getByRole('row').filter({ hasText: /laptop-maj|printer/ });

    // Backend order is kept until a header is clicked.
    await expect(hostHeader).toHaveAttribute('aria-sort', 'none');
    await expect(hostRows().nth(0)).toContainText('laptop-maj');
    await expect(hostRows().nth(1)).toContainText('printer');

    await hostHeader.getByRole('button').click();
    await expect(hostHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(hostRows().nth(0)).toContainText('laptop-maj');
    await expect(hostRows().nth(1)).toContainText('printer');

    await hostHeader.getByRole('button').click();
    await expect(hostHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(hostRows().nth(0)).toContainText('printer');
    await expect(hostRows().nth(1)).toContainText('laptop-maj');

    // Durations sort by their value, not their text: 5m10s comes before 9m32s.
    const expiresHeader = leases.getByRole('columnheader', { name: 'Expires' });
    await expiresHeader.getByRole('button').click();
    await expect(expiresHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(hostHeader).toHaveAttribute('aria-sort', 'none');
    await expect(hostRows().nth(0)).toContainText('printer');
    await expect(hostRows().nth(1)).toContainText('laptop-maj');
  });

  test('action columns have no sort control', async ({
    page,
    resetMocks,
    seedRouter,
    mockOverviewBackend,
    mockDhcpBackend,
  }) => {
    await resetMocks();
    await seedRouter({
      id: 'rtr_sort2',
      name: 'Sort Router',
      host: '10.10.10.8',
      model: 'hAP ax3',
    });
    await mockOverviewBackend({ id: 'rtr_sort2', model: 'hAP ax3' });
    await mockDhcpBackend({ id: 'rtr_sort2' });
    await page.goto('/router/rtr_sort2/lan');

    const headers = page.getByTestId('dhcp-leases').getByRole('columnheader');
    await expect(headers.last()).not.toHaveAttribute('aria-sort', /.*/);
    await expect(headers.last().getByRole('button')).toHaveCount(0);
    await expect(headers.first().getByRole('button')).toHaveCount(1);
  });
});
