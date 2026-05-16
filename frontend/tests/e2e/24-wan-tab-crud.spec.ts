import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_wan';

// Section order in WanPage: 0 Starlink, 1 Domestic, 2 Masking VPN, 3 Domestic VPN.
const newButton = (page: import('@playwright/test').Page, index: number) =>
  page.getByRole('button', { name: 'New' }).nth(index);

test.describe('WAN tab', () => {
  test('tab is enabled, lists the four sections and shows empty states', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await expect(
      page.getByRole('heading', { name: 'Foreign / Starlink', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Domestic', exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Starlink Masking VPN Client', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Domestic VPN Interfaces', exact: true }),
    ).toBeVisible();

    await expect(page.getByText('No Starlink uplinks yet')).toBeVisible();
    await expect(page.getByText('No masking VPN clients yet')).toBeVisible();
  });

  test('add, edit and delete a Starlink uplink (persisted)', async ({
    page,
    resetMocks,
    seedRouter,
  }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await newButton(page, 0).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name').fill('My SL');
    await dialog.getByRole('combobox', { name: 'Starlink WAN' }).click();
    await page.getByRole('option', { name: 'ether1' }).click();
    await dialog.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText('My SL')).toBeVisible();
    await expect(page.getByText('ether1')).toBeVisible();

    await page.reload();
    await expect(page.getByText('My SL')).toBeVisible();

    await page.getByRole('button', { name: 'edit My SL' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Name').fill('My SL2');
    await editDialog.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('My SL2')).toBeVisible();

    await page.getByRole('button', { name: 'delete My SL2' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^delete$/i })
      .click();
    await expect(page.getByText('My SL2')).toHaveCount(0);
    await expect(page.getByText('No Starlink uplinks yet')).toBeVisible();
  });

  test('add a masking VPN client', async ({ page, resetMocks, seedRouter }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'WAN Router' });
    await page.goto(`/router/${ROUTER_ID}/wan`);

    await newButton(page, 2).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Name').fill('mask-one');
    await dialog.getByRole('radio', { name: 'L2TP' }).click();
    await dialog.getByLabel('Server').fill('vpn.example.com');
    await dialog.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText('mask-one')).toBeVisible();
    await expect(page.getByText('vpn.example.com')).toBeVisible();
  });
});
