import { apiRequest } from './http';
import type { SystemCredentials } from './system';

export type NetHostType = 'foreign' | 'vpn' | 'domestic' | '';

export interface NetStatusEntry {
  host: string;
  status: string;
  since: string;
  type: NetHostType;
}

function authHeaders({ host, username, password }: SystemCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchNetStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<NetStatusEntry[]> {
  return apiRequest<NetStatusEntry[]>('/api/net/status', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}
