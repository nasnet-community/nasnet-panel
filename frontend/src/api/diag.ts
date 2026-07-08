import { apiRequest, ApiError } from './http';
import { BACKEND_URL } from './config';
import type { SystemCredentials } from './system';

export interface DiagStatusResponse {
  progress: number;
  running: boolean;
  fileSize?: string;
  generateTime?: string;
}

export const DIAG_REPORT_FILENAME = 'nasnet-diagnostic-report.txt';

function authHeaders({ host, username, password }: SystemCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function generateDiag(creds: SystemCredentials): Promise<void> {
  await apiRequest('/api/diag/generate', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}

export async function fetchDiagStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<DiagStatusResponse> {
  return apiRequest<DiagStatusResponse>('/api/diag/status', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchDiagReport(creds: SystemCredentials): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/diag/download`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;
    throw new ApiError(
      body?.error || body?.message || `Request failed (${response.status})`,
      response.status,
    );
  }
  return response.text();
}
