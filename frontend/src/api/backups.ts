import i18n from '../i18n';
import { apiRequest, ApiError } from './http';
import { BACKEND_URL } from './config';
import type { SystemCredentials } from './system';

export interface BackupFileResponse {
  filename: string;
  size: string;
  sizeBytes: number;
  date: string;
}

function authHeaders({ host, username, password }: SystemCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchBackups(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<BackupFileResponse[]> {
  const data = await apiRequest<BackupFileResponse[] | null>('/api/system/backups', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}

export async function createBackup(creds: SystemCredentials): Promise<BackupFileResponse> {
  return apiRequest<BackupFileResponse>('/api/system/backup', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}

// The router reboots to apply the backup, so the connection drops after this returns.
export async function restoreBackup(creds: SystemCredentials, filename: string): Promise<void> {
  await apiRequest<void>('/api/system/restore', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ filename }),
  });
}

export async function deleteBackup(creds: SystemCredentials, filename: string): Promise<void> {
  await apiRequest<void>(`/api/system/backup/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
  });
}

export async function downloadBackup(creds: SystemCredentials, filename: string): Promise<Blob> {
  const response = await fetch(
    `${BACKEND_URL}/api/system/backup/download/${encodeURIComponent(filename)}`,
    { method: 'GET', headers: authHeaders(creds), cache: 'no-store' },
  );
  if (!response.ok) {
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
  return response.blob();
}
