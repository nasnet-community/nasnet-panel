import { apiRequest } from './http';
import type { SystemCredentials } from './system';

export type NetHostType = 'foreign' | 'vpn' | 'domestic' | '';

export interface NetStatusEntry {
  host: string;
  status: string;
  since: string;
  type: NetHostType;
}

export async function fetchNetStatus(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<NetStatusEntry[]> {
  return apiRequest<NetStatusEntry[]>('/api/net/status', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
}
