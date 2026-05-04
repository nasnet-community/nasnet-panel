import { apiRequest } from './http';
import type { SystemCredentials } from './system';

export interface UpdateInfoResponse {
  version: string;
  buildTime: string;
  channel: string;
  updatePolicy: string;
  currentTime: string;
  installTime: string;
  scheduledTime: string;
}

export interface UpdateCheckResponse {
  channel: string;
  installedVersion: string;
  latestVersion: string;
  status: string;
  updateAvailable: boolean;
}

export interface UpdateInstallResponse {
  success: boolean;
  message: string;
  installedVersion: string;
  latestVersion: string;
}

function authHeaders({ host, username, password }: SystemCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchUpdateInfo(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<UpdateInfoResponse> {
  return apiRequest<UpdateInfoResponse>('/api/system/updates', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function checkForUpdates(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<UpdateCheckResponse> {
  return apiRequest<UpdateCheckResponse>('/api/system/check-for-updates', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function installUpdate(creds: SystemCredentials): Promise<UpdateInstallResponse> {
  return apiRequest<UpdateInstallResponse>('/api/system/install-update', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}
