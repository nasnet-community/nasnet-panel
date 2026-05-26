import type { SystemOverview, VPNActiveClient } from '../mocks/types';
import { formatBytes } from '../utils/format';
import { apiRequest } from './http';

export interface SystemCredentials {
  host: string;
  username: string;
  password: string;
}

export interface SystemInfoResponse {
  identity: string;
  architecture: string;
  boardName: string;
  version: string;
  buildTime: string;
  license: string;
  updateChannel: string;
}

export interface ResourceInfoResponse {
  uptime: string;
  cpuCount: number;
  cpuLoad: number;
  cpuFrequency: string;
  memoryTotal: string;
  memoryUsed: string;
  memoryFree: string;
  memoryTotalBytes: number;
  memoryUsedBytes: number;
  memoryFreeBytes: number;
  hddTotal: string;
  hddFree: string;
  hddTotalBytes: number;
  hddFreeBytes: number;
  badBlocks: string;
  version: string;
  architecture: string;
  boardName: string;
}

export interface DHCPLeaseResponse {
  id: string;
  address: string;
  macAddress: string;
  hostName?: string;
  status: string;
  dynamic: boolean;
}

function authHeaders({ host, username, password }: SystemCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchSystemInfo(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<SystemInfoResponse> {
  return apiRequest<SystemInfoResponse>('/api/system/info', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchSystemResources(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<ResourceInfoResponse> {
  return apiRequest<ResourceInfoResponse>('/api/system/resources', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchDHCPLeases(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<DHCPLeaseResponse[]> {
  const leases = await apiRequest<DHCPLeaseResponse[] | null>('/api/dhcp/leases', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return leases ?? [];
}

export interface InterfaceTrafficResponse {
  name: string;
  rxBitsPerSecond: number;
  txBitsPerSecond: number;
  rxPacketsPerSecond: number;
  txPacketsPerSecond: number;
}

export interface InterfaceResponse {
  id: string;
  name: string;
  defaultName?: string;
  type: string;
  running: boolean;
  disabled: boolean;
  mac?: string;
  mtu?: number;
  comment?: string;
  rx?: string;
  tx?: string;
  actualMtu?: number;
}

export interface IpAddressResponse {
  id: string;
  address: string;
  interface: string;
  dynamic: boolean;
  disabled: boolean;
}

export interface RouteResponse {
  id: string;
  dstAddress: string;
  gateway: string;
  interface?: string;
  active: boolean;
  distance: number;
}

export async function fetchInterfaces(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<InterfaceResponse[]> {
  const list = await apiRequest<InterfaceResponse[] | null>('/api/interface/interfaces', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export type WanInterfaceType = 'foreign' | 'domestic';

export async function updateWanInterface(
  creds: SystemCredentials,
  name: string,
  type: WanInterfaceType,
): Promise<void> {
  await apiRequest<unknown>(`/api/interface/wan/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: {
      ...authHeaders(creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  });
}

export async function fetchRoutes(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<RouteResponse[]> {
  const list = await apiRequest<RouteResponse[] | null>('/api/routes', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function fetchVPNClients(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<VPNActiveClient[]> {
  const clients = await apiRequest<VPNActiveClient[] | null>('/api/vpn/clients', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return clients ?? [];
}

export async function setSystemIdentity(creds: SystemCredentials, name: string): Promise<void> {
  await apiRequest<void>('/api/system/identity', {
    method: 'PUT',
    headers: {
      ...authHeaders(creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
}

export async function rebootSystem(creds: SystemCredentials): Promise<void> {
  await apiRequest<void>('/api/system/reboot', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}

export async function changeUserPassword(
  creds: SystemCredentials,
  newPassword: string,
): Promise<void> {
  await apiRequest<void>('/api/system/password', {
    method: 'PUT',
    headers: {
      ...authHeaders(creds),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: creds.username, newPassword }),
  });
}

export async function shutdownSystem(creds: SystemCredentials): Promise<void> {
  await apiRequest<void>('/api/system/shutdown', {
    method: 'POST',
    headers: authHeaders(creds),
  });
}

export async function fetchInterfaceTraffic(
  creds: SystemCredentials,
  interfaceName: string,
  signal?: AbortSignal,
): Promise<InterfaceTrafficResponse> {
  return apiRequest<InterfaceTrafficResponse>(
    `/api/interfaces/${encodeURIComponent(interfaceName)}/traffic`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export type DynamicOverview = Pick<
  SystemOverview,
  | 'uptime'
  | 'cpuLoad'
  | 'cpuCount'
  | 'memoryUsedBytes'
  | 'memoryTotalBytes'
  | 'memoryUsedLabel'
  | 'memoryTotalLabel'
  | 'hddUsedBytes'
  | 'hddTotalBytes'
  | 'hddUsedLabel'
  | 'hddTotalLabel'
  | 'dhcpLeases'
  | 'vpnTunnels'
>;

export async function fetchDynamicOverview(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<DynamicOverview> {
  const [resources, leases, vpnClients] = await Promise.all([
    fetchSystemResources(creds, signal),
    fetchDHCPLeases(creds, signal).catch(() => [] as DHCPLeaseResponse[]),
    fetchVPNClients(creds, signal).catch(() => [] as VPNActiveClient[]),
  ]);
  const hddUsedBytes = Math.max(0, resources.hddTotalBytes - resources.hddFreeBytes);
  return {
    uptime: resources.uptime,
    cpuLoad: resources.cpuLoad,
    cpuCount: resources.cpuCount,
    memoryUsedBytes: resources.memoryUsedBytes,
    memoryTotalBytes: resources.memoryTotalBytes,
    memoryUsedLabel: resources.memoryUsed,
    memoryTotalLabel: resources.memoryTotal,
    hddUsedBytes,
    hddTotalBytes: resources.hddTotalBytes,
    hddUsedLabel: formatBytes(hddUsedBytes),
    hddTotalLabel: resources.hddTotal,
    dhcpLeases: leases.length,
    vpnTunnels: vpnClients.length,
  };
}

export async function fetchSystemOverview(
  routerId: string,
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<SystemOverview> {
  const [info, dynamic] = await Promise.all([
    fetchSystemInfo(creds, signal),
    fetchDynamicOverview(creds, signal),
  ]);

  return {
    routerId,
    identity: info.identity || 'unknown',
    model: info.boardName || 'unknown',
    version: info.version || 'unknown',
    buildTime: info.buildTime || '',
    updateChannel: info.updateChannel || '',
    license: info.license || '',
    serial: `NN-${routerId.slice(-4).toUpperCase()}`,
    temperatureC: 0,
    interfaceCount: 0,
    ...dynamic,
  };
}
