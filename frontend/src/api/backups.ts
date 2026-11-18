import i18n from '../i18n';
import { apiRequest, authorizedFetch, ApiError } from './http';
import { BACKEND_URL } from './config';
import type { SystemCredentials } from './system';

export interface BackupFileResponse {
  filename: string;
  size: string;
  sizeBytes: number;
  date: string;
}

export async function fetchBackups(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<BackupFileResponse[]> {
  const data = await apiRequest<BackupFileResponse[] | null>('/api/system/backups', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}

export async function createBackup(creds: SystemCredentials): Promise<BackupFileResponse> {
  return apiRequest<BackupFileResponse>('/api/system/backup', {
    method: 'POST',
    auth: creds,
  });
}

// The router reboots to apply the backup, so the connection drops after this returns.
export async function restoreBackup(creds: SystemCredentials, filename: string): Promise<void> {
  await apiRequest<void>('/api/system/restore', {
    method: 'POST',
    auth: creds,
    body: JSON.stringify({ filename }),
  });
}

export async function deleteBackup(creds: SystemCredentials, filename: string): Promise<void> {
  await apiRequest<void>(`/api/system/backup/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    auth: creds,
  });
}

// Largest .backup file the restore-from-file route accepts; the backend enforces the same limit.
export const MAX_UPLOADED_BACKUP_BYTES = 16 * 1024 * 1024;

async function throwResponseError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  throw new ApiError(
    body?.error ||
      body?.message ||
      i18n.t('api.requestFailed', { ns: 'ui', status: response.status }),
    response.status,
  );
}

// Uploads a .backup file from this computer to the router and restores it. Sent as multipart
// without apiRequest, because it forces a JSON Content-Type. The router reboots to apply the
// backup, so the connection drops after this returns.
export async function restoreBackupFromFile(
  creds: SystemCredentials,
  file: File,
  password?: string,
): Promise<void> {
  const form = new FormData();
  form.append('file', file, file.name);
  if (password) form.append('password', password);
  const response = await authorizedFetch(
    `${BACKEND_URL}/api/system/restore/upload`,
    { method: 'POST', body: form },
    creds,
  );
  if (!response.ok) await throwResponseError(response);
}

export async function downloadBackup(creds: SystemCredentials, filename: string): Promise<Blob> {
  const response = await authorizedFetch(
    `${BACKEND_URL}/api/system/backup/download/${encodeURIComponent(filename)}`,
    { method: 'GET', cache: 'no-store' },
    creds,
  );
  if (!response.ok) await throwResponseError(response);
  return response.blob();
}
