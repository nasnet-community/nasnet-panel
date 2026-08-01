import { apiRequest } from './http';
import type { SystemCredentials } from './system';

export type PluginCredentials = SystemCredentials;

export interface PluginInfoResponse {
  id: string;
  version: string;
  name: string;
  author: string;
  category: string;
  tagline: string;
  url: string;
  icon: string;
  installed: boolean;
  running: boolean;
  installing: boolean;
  failed: boolean;
  note?: string;
}

export type PluginInstallPhase =
  | 'preparing'
  | 'creating_interface'
  | 'creating_mounts'
  | 'running_pre_install_script'
  | 'creating_container'
  | 'pulling'
  | 'starting_container'
  | 'running_post_install_script'
  | 'done'
  | 'error';

export interface InstallPluginResponse {
  id: string;
  pluginId: string;
}

export interface PluginInstallStatusResponse {
  pluginId: string;
  phase: PluginInstallPhase;
  message?: string;
  startedAt?: string;
  containerId?: string;
  interface?: string;
}

export interface UninstallPluginResponse {
  id: string;
  mountLists?: string[];
  interface?: string;
  warnings?: string[];
}

function authHeaders({ host, username, password }: PluginCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchPlugins(
  creds: PluginCredentials,
  signal?: AbortSignal,
): Promise<PluginInfoResponse[]> {
  return apiRequest<PluginInfoResponse[]>('/api/plugin/plugins', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function installPlugin(
  creds: PluginCredentials,
  id: string,
): Promise<InstallPluginResponse> {
  return apiRequest<InstallPluginResponse>('/api/plugin/install', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ id }),
  });
}

export async function fetchPluginInstallStatus(
  creds: PluginCredentials,
  pluginId: string,
  signal?: AbortSignal,
): Promise<PluginInstallStatusResponse> {
  return apiRequest<PluginInstallStatusResponse>(
    `/api/plugin/status/${encodeURIComponent(pluginId)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export async function uninstallPlugin(
  creds: PluginCredentials,
  name: string,
): Promise<UninstallPluginResponse> {
  return apiRequest<UninstallPluginResponse>(`/api/plugin/plugin/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
  });
}
