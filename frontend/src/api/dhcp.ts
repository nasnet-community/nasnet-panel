import { apiRequest } from './http';

export interface DhcpCredentials {
  host: string;
  username: string;
  password: string;
}

export interface DhcpLease {
  id: string;
  address: string;
  macAddress: string;
  clientId?: string;
  hostName?: string;
  serverName?: string;
  status: string;
  expiresAfter?: string;
  lastSeen?: string;
  comment?: string;
  dynamic: boolean;
}

export interface DhcpClient {
  id: string;
  name?: string;
  interface: string;
  status: string;
  address: string;
  gateway?: string;
  primaryDns?: string;
  secondaryDns?: string;
  usePeerDns: boolean;
  usePeerNtp: boolean;
  expiresAfter?: string;
  disabled: boolean;
  comment?: string;
}

export interface DhcpServer {
  id: string;
  name: string;
  interface: string;
  addressPool: string;
  ranges: string[];
  gateway?: string;
  dnsServers?: string;
  leaseTime?: string;
  disabled: boolean;
  comment?: string;
  localAddress?: string;
}

export interface DhcpLeaseAction {
  macAddress: string;
  id: string;
  address: string;
}

function authHeaders({ host, username, password }: DhcpCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchDhcpLeases(
  creds: DhcpCredentials,
  signal?: AbortSignal,
): Promise<DhcpLease[]> {
  const leases = await apiRequest<DhcpLease[] | null>('/api/dhcp/leases', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return leases ?? [];
}

export async function fetchDhcpClients(
  creds: DhcpCredentials,
  signal?: AbortSignal,
): Promise<DhcpClient[]> {
  const clients = await apiRequest<DhcpClient[] | null>('/api/dhcp/clients', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return clients ?? [];
}

export async function fetchDhcpServers(
  creds: DhcpCredentials,
  signal?: AbortSignal,
): Promise<DhcpServer[]> {
  const servers = await apiRequest<DhcpServer[] | null>('/api/dhcp/servers', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return servers ?? [];
}

export async function makeDhcpLeaseStatic(
  creds: DhcpCredentials,
  macAddress: string,
  signal?: AbortSignal,
): Promise<DhcpLeaseAction> {
  const params = new URLSearchParams({ macAddress });
  return apiRequest<DhcpLeaseAction>(`/api/dhcp/leases/make-static?${params.toString()}`, {
    method: 'POST',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function removeDhcpLease(
  creds: DhcpCredentials,
  macAddress: string,
  signal?: AbortSignal,
): Promise<DhcpLeaseAction> {
  return apiRequest<DhcpLeaseAction>(`/api/dhcp/leases/${encodeURIComponent(macAddress)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}
