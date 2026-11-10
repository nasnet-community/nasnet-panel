import type { Page, Route } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_settings';

const envelope = <T>(data: T, status = 200) => JSON.stringify({ status, message: 'OK', data });

interface Call {
  method: string;
  path: string;
  body: unknown;
}

interface Status {
  status: string;
  running: boolean;
  failed: boolean;
  progress: number;
  step?: string;
  message?: string;
  startTime?: string;
  endTime?: string;
}

interface MockOptions {
  schedulerMissing?: boolean;
  /** Status responses served in order; the last one repeats. */
  statuses?: Status[];
  startConflict?: boolean;
  /** Country the backend reports; undefined serves 404 like a backend without the setting. */
  country?: string;
}

const idle: Status = { status: 'idle', running: false, failed: false, progress: 0 };

// Serves the scheduler and domestic update endpoints and records every write.
async function mockSettings(page: Page, options: MockOptions = {}) {
  const calls: Call[] = [];
  const scheduler = {
    name: 'DomesticIPUpdate',
    enabled: true,
    startDate: '2026-11-01',
    startTime: '12:00:00',
    interval: '7d 00:00:00',
    runCount: 1,
    nextRun: '2026-11-15 12:00:00',
  };
  let statuses = [...(options.statuses ?? [idle])];

  const json = (route: Route, data: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: envelope(data, status) });

  await page.route('**/api/system/scheduler/*', async (route) => {
    const request = route.request();
    if (options.schedulerMissing) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, message: 'Scheduler not found' }),
      });
    }
    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as { startTime: string; interval: string };
      calls.push({ method: 'PUT', path: new URL(request.url()).pathname, body });
      scheduler.startTime = body.startTime;
      scheduler.interval = `${parseInt(body.interval, 10)}d 00:00:00`;
      return json(route, null);
    }
    return json(route, scheduler);
  });

  let country = options.country;
  await page.route('**/api/firewall/addresslist/domestic/country', async (route) => {
    const request = route.request();
    if (country === undefined) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ status: 404, message: 'Not Found' }),
      });
    }
    if (request.method() === 'PUT') {
      const body = request.postDataJSON() as { country: string };
      calls.push({ method: 'PUT', path: '/api/firewall/addresslist/domestic/country', body });
      country = body.country;
    }
    return json(route, { country });
  });

  await page.route('**/api/firewall/addresslist/domestic/update/status', async (route) => {
    const next = statuses.length > 1 ? statuses.shift()! : statuses[0];
    return json(route, next);
  });

  await page.route('**/api/firewall/addresslist/domestic/update', async (route) => {
    calls.push({ method: 'POST', path: '/api/firewall/addresslist/domestic/update', body: null });
    if (options.startConflict) {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 409,
          message: 'A domestic address list update is already running',
        }),
      });
    }
    return json(route, null, 202);
  });

  return {
    calls,
    setStatuses: (next: Status[]) => {
      statuses = [...next];
    },
  };
}

test.describe('Settings page domestic IP list updates', () => {
  test.beforeEach(async ({ resetMocks, seedRouter, mockDiagBackend }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Settings Router', host: '10.10.40.2' });
    await mockDiagBackend({ id: ROUTER_ID });
  });

  test('the Settings item in the top-right menu opens the page', async ({ page }) => {
    await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(new RegExp(`/router/${ROUTER_ID}/settings$`));
    await expect(page.getByTestId('domestic-list-update')).toBeVisible();
  });

  test('shows the current schedule in the form', async ({ page }) => {
    await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/settings`);

    await expect(page.getByRole('tab', { name: 'Domestic IP list' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const form = page.getByTestId('domestic-schedule-form');
    await expect(form.getByRole('combobox', { name: 'Runs' })).toContainText('Every 7 days');
    await expect(form.getByLabel('Start time')).toHaveValue('12:00');
    await expect(
      page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }),
    ).toBeDisabled();
    await expect(page.getByTestId('domestic-list-update')).toContainText('2026-11-15 12:00:00');
  });

  test('edits the schedule on the page with a preset and a custom interval', async ({ page }) => {
    const { calls } = await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const form = page.getByTestId('domestic-schedule-form');
    await form.getByRole('combobox', { name: 'Runs' }).click();
    await page.getByRole('option', { name: 'Every day' }).click();
    await form.getByLabel('Start time').fill('03:30');
    await page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Update schedule saved')).toBeVisible();
    await expect(form.getByRole('combobox', { name: 'Runs' })).toContainText('Every day');
    await expect(form.getByLabel('Start time')).toHaveValue('03:30');
    await expect(
      page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }),
    ).toBeDisabled();

    await form.getByRole('combobox', { name: 'Runs' }).click();
    await page.getByRole('option', { name: 'Custom' }).click();
    const days = form.getByLabel('Every how many days');
    await days.fill('0');
    await page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }).click();
    await expect(form).toContainText('Enter a whole number of days from 1 to 365.');
    await days.fill('10');
    await page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }).click();
    await expect(form.getByLabel('Every how many days')).toHaveValue('10');
    await expect(
      page.getByTestId('domestic-list-update').getByRole('button', { name: 'Save' }),
    ).toBeDisabled();

    expect(calls).toEqual([
      {
        method: 'PUT',
        path: '/api/system/scheduler/DomesticIPUpdate',
        body: { interval: '1d', startTime: '03:30:00' },
      },
      {
        method: 'PUT',
        path: '/api/system/scheduler/DomesticIPUpdate',
        body: { interval: '10d', startTime: '03:30:00' },
      },
    ]);
  });

  test('cancel puts back the saved schedule', async ({ page }) => {
    const { calls } = await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const form = page.getByTestId('domestic-schedule-form');
    await form.getByLabel('Start time').fill('05:00');
    await page.getByTestId('domestic-list-update').getByRole('button', { name: 'Cancel' }).click();
    await expect(form.getByLabel('Start time')).toHaveValue('12:00');
    expect(calls).toEqual([]);
  });

  test('starts an update and follows its progress to the end', async ({ page }) => {
    const { calls, setStatuses } = await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const card = page.getByTestId('domestic-list-update');
    await expect(card).toContainText('2026-11-15 12:00:00');
    setStatuses([
      {
        status: 'running',
        running: true,
        failed: false,
        progress: 45,
        step: 'fetching',
        startTime: '2026-11-10 10:00:00',
      },
      {
        status: 'completed',
        running: false,
        failed: false,
        progress: 100,
        step: 'completed',
        startTime: '2026-11-10 10:00:00',
        endTime: '2026-11-10 10:01:30',
      },
    ]);
    await card.getByRole('button', { name: 'Update now' }).click();

    await expect(card.getByTestId('domestic-update-progress')).toContainText(
      'Downloading address ranges',
    );
    await expect(card.getByRole('button', { name: 'Updating…' })).toBeDisabled();
    await expect(card.getByText('Running', { exact: true })).toBeVisible();
    await expect(card.getByText('Completed', { exact: true })).toBeVisible();
    await expect(card).toContainText('2026-11-10 10:01:30');
    await expect(page.getByText('Domestic IP list updated')).toBeVisible();
    expect(calls).toEqual([
      { method: 'POST', path: '/api/firewall/addresslist/domestic/update', body: null },
    ]);
  });

  test('shows the router message when the last update failed', async ({ page }) => {
    await mockSettings(page, {
      statuses: [
        {
          status: 'failed',
          running: false,
          failed: true,
          progress: 30,
          step: 'fetching',
          message: 'Fetch failed after 4 attempts',
          endTime: '2026-11-09 12:00:40',
        },
      ],
    });
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const card = page.getByTestId('domestic-list-update');
    await expect(card.getByText('Failed', { exact: true })).toBeVisible();
    await expect(card).toContainText('Fetch failed after 4 attempts');
  });

  test('reports an update that is already running', async ({ page }) => {
    await mockSettings(page, { startConflict: true });
    await page.goto(`/router/${ROUTER_ID}/settings`);

    await page.getByRole('button', { name: 'Update now' }).click();
    await expect(page.getByText('An update is already running')).toBeVisible();
  });

  test('hides the schedule fields when the router has no scheduler', async ({ page }) => {
    await mockSettings(page, { schedulerMissing: true });
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const card = page.getByTestId('domestic-list-update');
    await expect(card).toContainText('This router has no update schedule.');
    await expect(card.getByRole('combobox', { name: 'Runs' })).toHaveCount(0);
    await expect(card.getByLabel('Start time')).toHaveCount(0);
  });

  test('shows Iran, disabled, on backends that cannot report the country', async ({ page }) => {
    await mockSettings(page);
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const select = page.getByRole('combobox', { name: 'Country' });
    await expect(select).toContainText('Iran (IR)');
    await expect(select).toBeDisabled();
    await expect(select.locator('img[src="/flags/ir.svg"]')).toHaveCount(1);
    await expect(page.getByTestId('domestic-schedule-form')).toContainText('Coming soon');
  });

  test("shows the router's country, disabled", async ({ page }) => {
    const { calls } = await mockSettings(page, { country: 'CU' });
    await page.goto(`/router/${ROUTER_ID}/settings`);

    const select = page.getByRole('combobox', { name: 'Country' });
    await expect(select).toContainText('Cuba (CU)');
    await expect(select.locator('img[src="/flags/cu.svg"]')).toHaveCount(1);
    await expect(select).toBeDisabled();
    expect(calls).toEqual([]);
  });
});
