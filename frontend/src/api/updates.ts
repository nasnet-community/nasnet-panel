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
  updateAvailable: boolean;
  fromVersion: string;
  toVersion?: string;
}

export type SystemUpdatePhase = 'idle' | 'downloading' | 'rebooting' | 'done' | 'error';

export interface SystemUpdateStatusResponse {
  phase: SystemUpdatePhase;
  message?: string;
  fromVersion?: string;
  toVersion?: string;
  startedAt?: string;
}

export interface AppVersionResponse {
  version: string;
}

export interface AppCheckForUpdatesResponse {
  appVersion: string;
  latestVersion: string;
  releaseDate: string;
  releaseUrl: string;
  updateAvailable: boolean;
}

export interface AppInstallUpdateResponse {
  updateAvailable: boolean;
  fromVersion: string;
  toVersion?: string;
}

export type AppUpdatePhase = 'idle' | 'preparing' | 'pulling' | 'restarting' | 'done' | 'error';

export type AppReconfigState = 'idle' | 'pending' | 'running' | 'completed' | 'failed';

export interface AppReconfigStatus {
  state: AppReconfigState;
  step: string;
  progress: number;
  error?: string;
  warnings?: string[];
}

export interface AppUpdateStatusResponse {
  phase: AppUpdatePhase;
  message?: string;
  version?: string;
  startedAt?: string;
  /** Present when the update reconfigures the router once the new version is running. */
  reconfig?: AppReconfigStatus;
}

export type AppUpdateChannel = 'stable' | 'rc' | 'dev';

export interface AppRelease {
  tag: string;
  prerelease: boolean;
  releaseDate: string;
  releaseUrl: string;
  minRouterosVersion: string;
  minAppVersion: string;
  autoReconfigable: boolean;
  changelog: string[];
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

export async function fetchSystemUpdateStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<SystemUpdateStatusResponse> {
  return apiRequest<SystemUpdateStatusResponse>('/api/system/update-status', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchAppVersion(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppVersionResponse> {
  return apiRequest<AppVersionResponse>('/api/app/version', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function checkAppForUpdates(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppCheckForUpdatesResponse> {
  return apiRequest<AppCheckForUpdatesResponse>('/api/app/check-for-updates', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function installAppUpdate(
  creds: SystemCredentials,
): Promise<AppInstallUpdateResponse> {
  return apiRequest<AppInstallUpdateResponse>('/api/app/install-update', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}

export async function fetchAppUpdateStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppUpdateStatusResponse> {
  return apiRequest<AppUpdateStatusResponse>('/api/app/update-status', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchAppReleases(
  creds: SystemCredentials,
  channel: AppUpdateChannel,
  signal?: AbortSignal,
): Promise<AppRelease[]> {
  const query = new URLSearchParams({ channel, hideLowerVer: 'true' });
  const releases = await apiRequest<AppRelease[] | null>(`/api/app/updates?${query.toString()}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return releases ?? [];
}

export async function fetchAppUpdateChannel(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppUpdateChannel> {
  const data = await apiRequest<{ channel: AppUpdateChannel }>('/api/app/update/channel', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data.channel;
}

export async function startAppUpdate(
  creds: SystemCredentials,
  version: string,
): Promise<AppInstallUpdateResponse> {
  return apiRequest<AppInstallUpdateResponse>('/api/app/update', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ version }),
  });
}

export async function fetchAppUpdateProgress(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<AppUpdateStatusResponse> {
  return apiRequest<AppUpdateStatusResponse>('/api/app/update/status', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}
