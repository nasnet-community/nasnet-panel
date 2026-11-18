import type { Page, Route } from '@playwright/test';
import { test, expect } from './fixtures';

const ROUTER_ID = 'rtr_backups';

const envelope = <T>(data: T, status = 200) => JSON.stringify({ status, message: 'OK', data });

interface Backup {
  filename: string;
  size: string;
  sizeBytes: number;
  date: string;
}

interface Call {
  method: string;
  path: string;
  body: unknown;
}

interface MockOptions {
  listFails?: boolean;
  createConflict?: boolean;
  // Holds the download response until this promise resolves.
  holdDownload?: Promise<void>;
  uploadFails?: boolean;
}

interface UploadBody {
  contentType: string;
  multipart: string;
}

const UPLOAD_PATH = '/api/system/restore/upload';

const uploadBody = (calls: Call[]) => calls.find((c) => c.path === UPLOAD_PATH)?.body as UploadBody;

// Serves the backup endpoints from an in-memory list and records every write
// so a test can assert what the page sent.
async function mockBackups(page: Page, initial: Backup[], options: MockOptions = {}) {
  const backups = [...initial];
  const calls: Call[] = [];

  const notFound = (route: Route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ status: 404, message: 'Backup file not found' }),
    });

  await page.route('**/api/system/backups', async (route) => {
    if (options.listFails) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 500, message: 'Failed to list backups' }),
      });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: envelope(backups) });
  });

  await page.route('**/api/system/backup', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    calls.push({ method: 'POST', path: '/api/system/backup', body: null });
    if (options.createConflict) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 409,
          message: 'A restore is in progress',
          error: 'the router is restoring a backup and cannot create a new one now',
        }),
      });
      return;
    }
    const created = {
      filename: '2026-11-04_10-00-00.backup',
      size: '512.0 KiB',
      sizeBytes: 524288,
      date: '2026-11-04 10:00:00',
    };
    backups.unshift(created);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: envelope(created, 201),
    });
  });

  await page.route('**/api/system/backup/download/*', async (route) => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
    if (!backups.some((b) => b.filename === name)) return notFound(route);
    if (options.holdDownload) await options.holdDownload;
    await route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      headers: { 'Content-Disposition': `attachment; filename="${name}"` },
      body: 'backup-bytes',
    });
  });

  await page.route('**/api/system/backup/*', async (route) => {
    const request = route.request();
    if (request.method() !== 'DELETE') return route.fallback();
    const path = new URL(request.url()).pathname;
    calls.push({ method: 'DELETE', path, body: null });
    const name = decodeURIComponent(path.split('/').pop() ?? '');
    const index = backups.findIndex((b) => b.filename === name);
    if (index < 0) return notFound(route);
    backups.splice(index, 1);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'Backup deleted successfully' }),
    });
  });

  await page.route('**/api/system/restore', async (route) => {
    const request = route.request();
    calls.push({
      method: request.method(),
      path: '/api/system/restore',
      body: request.postDataJSON(),
    });
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 202,
        message: 'Restore initiated; the router will reboot to apply the backup',
      }),
    });
  });

  await page.route('**/api/system/restore/upload', async (route) => {
    const request = route.request();
    calls.push({
      method: request.method(),
      path: UPLOAD_PATH,
      body: {
        contentType: (await request.headerValue('content-type')) ?? '',
        multipart: request.postDataBuffer()?.toString('latin1') ?? '',
      },
    });
    if (options.uploadFails) {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 502,
          message: 'Could not connect to the router over SSH',
          error: 'failed to dial SSH: connection refused',
        }),
      });
      return;
    }
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 202,
        message: 'Restore initiated; the router will reboot to apply the backup',
      }),
    });
  });

  return calls;
}

const older: Backup = {
  filename: '2026-10-29_01-02-03.backup',
  size: '498.5 KiB',
  sizeBytes: 510464,
  date: '2026-10-29 01:02:03',
};

test.describe('Diagnostics page backups', () => {
  test.beforeEach(async ({ resetMocks, seedRouter, mockDiagBackend }) => {
    await resetMocks();
    await seedRouter({ id: ROUTER_ID, name: 'Backup Router', host: '10.10.30.2' });
    await mockDiagBackend({ id: ROUTER_ID });
  });

  test('shows an empty state when there are no backups', async ({ page }) => {
    await mockBackups(page, []);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await expect(page.getByTestId('backups-card')).toContainText('No backups yet.');
  });

  test('shows the backend error when the list fails', async ({ page }) => {
    await mockBackups(page, [], { listFails: true });
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await expect(page.getByTestId('backups-card')).toContainText('Failed to list backups');
  });

  test('creates a backup and lists it', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    const card = page.getByTestId('backups-card');
    await expect(card.getByRole('row', { name: /2026-10-29_01-02-03/ })).toContainText('498.5 KiB');

    await card.getByRole('button', { name: 'Create backup' }).click();

    await expect(card.getByRole('row', { name: /2026-11-04_10-00-00/ })).toContainText(
      '2026-11-04 10:00:00',
    );
    await expect(page.getByText(/Backup .2026-11-04_10-00-00\.backup. created/)).toBeVisible();
    expect(calls).toEqual([{ method: 'POST', path: '/api/system/backup', body: null }]);
  });

  test('shows a toast when the backend rejects a new backup', async ({ page }) => {
    await mockBackups(page, [], { createConflict: true });
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: 'Create backup' }).click();

    await expect(page.getByText('Failed to create backup')).toBeVisible();
    await expect(page.getByText(/restoring a backup and cannot create/)).toBeVisible();
  });

  test('downloads a backup', async ({ page }) => {
    await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: `Download ${older.filename}` }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(older.filename);
  });

  test('keeps the download button size while the download runs', async ({ page }) => {
    let release = () => {};
    const holdDownload = new Promise<void>((resolve) => {
      release = resolve;
    });
    await mockBackups(page, [older], { holdDownload });
    await page.goto(`/router/${ROUTER_ID}/backups`);

    const button = page.getByRole('button', { name: `Download ${older.filename}` });
    const before = await button.boundingBox();
    const downloadPromise = page.waitForEvent('download');
    await button.click();

    await expect(button).toHaveAttribute('aria-busy', 'true');
    const during = await button.boundingBox();
    expect(during?.width).toBe(before?.width);
    expect(during?.height).toBe(before?.height);
    await expect(button.locator('svg')).toHaveCount(0);

    release();
    await downloadPromise;
    await expect(button).not.toHaveAttribute('aria-busy');
    await expect(button.locator('svg')).toHaveCount(1);
  });

  test('deletes a backup after confirm', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: `Delete ${older.filename}` }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Delete backup?' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByTestId('backups-card')).toContainText('No backups yet.');
    expect(calls).toEqual([
      { method: 'DELETE', path: `/api/system/backup/${older.filename}`, body: null },
    ]);
  });

  test('cancelling the restore dialog sends nothing', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: `Restore ${older.filename}` }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm).toContainText('reboot');
    await confirm.getByRole('button', { name: 'Cancel' }).click();

    await expect(confirm).toBeHidden();
    expect(calls).toEqual([]);
  });

  test('restores a backup after confirm and leaves the router page', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: `Restore ${older.filename}` }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Restore backup?' })).toBeVisible();
    await confirm.getByRole('button', { name: 'Restore' }).click();

    await expect(page.getByText('Restore started. The router is rebooting.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect(calls).toEqual([
      { method: 'POST', path: '/api/system/restore', body: { filename: older.filename } },
    ]);
  });

  test('picking a backup file opens the confirm dialog and sends nothing yet', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByTestId('backup-file-input').setInputFiles({
      name: 'office.backup',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('backup-bytes'),
    });

    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Restore backup?' })).toBeVisible();
    await expect(confirm).toContainText('office.backup');
    await expect(confirm).toContainText('12 B');
    await expect(confirm).toContainText('made on this same router');
    await expect(confirm.getByLabel('Backup password')).toHaveValue('');
    await confirm.getByRole('button', { name: 'Cancel' }).click();

    await expect(confirm).toBeHidden();
    expect(calls).toEqual([]);
  });

  test('restores an uploaded backup with its password and leaves the router page', async ({
    page,
  }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByRole('button', { name: 'Restore from file' }).click();
    await page.getByTestId('backup-file-input').setInputFiles({
      name: 'Office.BACKUP',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('backup-bytes'),
    });
    const confirm = page.getByRole('dialog');
    await confirm.getByLabel('Backup password').fill('s3cret pass');
    await confirm.getByRole('button', { name: 'Restore' }).click();

    await expect(page.getByText('Restore started. The router is rebooting.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([`POST ${UPLOAD_PATH}`]);
    const upload = uploadBody(calls);
    expect(upload.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(upload.multipart).toContain('name="file"; filename="Office.BACKUP"');
    expect(upload.multipart).toContain('backup-bytes');
    expect(upload.multipart).toMatch(/name="password"\r\n\r\ns3cret pass\r\n/);
  });

  test('rejects a file that is not a .backup without sending it', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByTestId('backup-file-input').setInputFiles({
      name: 'config.rsc',
      mimeType: 'text/plain',
      buffer: Buffer.from('/ip address add'),
    });

    await expect(page.getByText('This is not a backup file')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(calls).toEqual([]);
  });

  test('rejects a backup file over 16 MB without sending it', async ({ page }) => {
    const calls = await mockBackups(page, [older]);
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByTestId('backup-file-input').setInputFiles({
      name: 'huge.backup',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(16 * 1024 * 1024 + 1),
    });

    await expect(page.getByText('Backup file is too large')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(calls).toEqual([]);
  });

  test('shows a toast and stays on the page when the upload restore fails', async ({ page }) => {
    const calls = await mockBackups(page, [older], { uploadFails: true });
    await page.goto(`/router/${ROUTER_ID}/backups`);

    await page.getByTestId('backup-file-input').setInputFiles({
      name: 'office.backup',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('backup-bytes'),
    });
    const confirm = page.getByRole('dialog');
    await confirm.getByRole('button', { name: 'Restore' }).click();

    await expect(page.getByText('Failed to restore backup')).toBeVisible();
    await expect(page.getByText(/Enable the router's SSH service/)).toBeVisible();
    await expect(confirm).toBeVisible();
    await expect(page).toHaveURL(/\/backups$/);
    expect(calls).toHaveLength(1);
    expect(uploadBody(calls).multipart).not.toContain('name="password"');
  });
});
