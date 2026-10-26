import { test, expect } from './fixtures';

test.describe('Easy-Mode wizard — virtual WiFi interfaces', () => {
  test('WAN step lists only physical WiFi interfaces', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_vwifi', name: 'Virtual WiFi Router' });
    await mockEasyConfigBackend({
      id: 'rtr_vwifi',
      interfaces: [
        { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
        { id: '*2', name: 'wifi1', type: 'wifi', running: true, disabled: false },
        {
          id: '*3',
          name: 'guest-wifi',
          type: 'wifi',
          running: true,
          disabled: false,
          virtual: true,
        },
        { id: '*4', name: 'iot-wifi', type: 'wifi', running: true, disabled: false, virtual: true },
      ],
    });
    await page.goto('/router/rtr_vwifi/config');

    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByRole('radio', { name: 'Wireless' }).first().click();
    await page.getByLabel(/starlink wan/i).click();
    await expect(page.getByRole('option', { name: 'wifi1' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'guest-wifi' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'iot-wifi' })).toHaveCount(0);
  });

  test('Wireless tile is hidden when every WiFi interface is virtual', async ({
    page,
    resetMocks,
    seedRouter,
    mockEasyConfigBackend,
  }) => {
    await resetMocks();
    await seedRouter({ id: 'rtr_vonly', name: 'Virtual-only Router' });
    await mockEasyConfigBackend({
      id: 'rtr_vonly',
      interfaces: [
        { id: '*1', name: 'ether1', type: 'ether', running: true, disabled: false },
        {
          id: '*2',
          name: 'guest-wifi',
          type: 'wifi',
          running: true,
          disabled: false,
          virtual: true,
        },
      ],
    });
    await page.goto('/router/rtr_vonly/config');

    await page.getByRole('radio', { name: /starlink-only/i }).check();
    await page.getByRole('button', { name: /^next$/i }).click();

    await expect(page.getByRole('radio', { name: 'Ethernet' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Wireless' })).toHaveCount(0);
  });
});
