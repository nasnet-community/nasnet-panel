import i18n from '../i18n';
import { apiRequest, authorizedFetch, ApiError } from './http';
import { BACKEND_URL } from './config';
import type { SystemCredentials } from './system';

export interface DiagStatusResponse {
  progress: number;
  running: boolean;
  fileSize?: string;
  generateTime?: string;
}

export const DIAG_REPORT_FILENAME = 'nasnet-diagnostic-report.txt';

export async function generateDiag(creds: SystemCredentials): Promise<void> {
  await apiRequest('/api/diag/generate', {
    method: 'POST',
    auth: creds,
  });
}

export async function fetchDiagStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<DiagStatusResponse> {
  return apiRequest<DiagStatusResponse>('/api/diag/status', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
}

export async function deleteDiagFile(creds: SystemCredentials): Promise<void> {
  await apiRequest('/api/diag/file', {
    method: 'DELETE',
    auth: creds,
    cache: 'no-store',
  });
}

export async function fetchDiagReport(creds: SystemCredentials): Promise<string> {
  const response = await authorizedFetch(
    `${BACKEND_URL}/api/diag/download`,
    { method: 'GET', cache: 'no-store' },
    creds,
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
  return response.text();
}
