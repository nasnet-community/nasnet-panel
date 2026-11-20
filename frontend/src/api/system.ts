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
  systemId: string;
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

export async function fetchSystemInfo(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<SystemInfoResponse> {
  return apiRequest<SystemInfoResponse>('/api/system/info', {
    method: 'GET',
    auth: creds,
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
    auth: creds,
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
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return leases ?? [];
}

export interface InterfaceGraphSample {
  rxBytes: number;
  txBytes: number;
  rx: string;
  tx: string;
  timestamp: string;
}

export interface InterfaceGraphResponse {
  interfaceName: string;
  trafficData: InterfaceGraphSample[] | null;
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

export async function fetchInterfaces(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<InterfaceResponse[]> {
  const list = await apiRequest<InterfaceResponse[] | null>('/api/interface/interfaces', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export interface EthernetInterfaceResponse {
  id?: string;
  name?: string;
  defaultName?: string;
  running?: boolean;
  disabled?: boolean;
  status?: string;
  rate?: string;
  fullDuplex?: boolean;
}

export async function fetchEthernetInterfaces(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<EthernetInterfaceResponse[]> {
  const list = await apiRequest<EthernetInterfaceResponse[] | null>('/api/interface/ethernets', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export interface CableTestResponse {
  name: string;
  status: string;
  cablePairs?: string;
}

export async function testEthernetCable(
  creds: SystemCredentials,
  nameOrId: string,
): Promise<CableTestResponse> {
  return apiRequest<CableTestResponse>(
    `/api/interface/ethernet/cable-test/${encodeURIComponent(nameOrId)}`,
    {
      method: 'POST',
      auth: creds,
      cache: 'no-store',
    },
  );
}

export async function resetInterfaceTrafficCounter(
  creds: SystemCredentials,
  nameOrId: string,
): Promise<void> {
  await apiRequest<void>(`/api/interface/traffic-counter/${encodeURIComponent(nameOrId)}`, {
    method: 'DELETE',
    auth: creds,
  });
}

export type WanInterfaceType = 'foreign' | 'domestic';

/** Comma-separated list of `wpa-psk`, `wpa2-psk` and `wpa3-psk`. Empty means `wpa2-psk,wpa3-psk`. */
export type WanAuthType = string;

export interface UpdateWanInterfaceRequest {
  interface: string;
  type: WanInterfaceType;
  ssid?: string;
  password?: string;
  authType?: WanAuthType;
  /** Empty or `dhcp` for DHCP, otherwise an IPv4 address with an optional prefix. */
  ip?: string;
  /** Only with a static `ip`. Defaults to the first address of its network. */
  gateway?: string;
}

export type WanStatus = 'scanning' | 'connecting' | 'authorized' | 'link-ok' | 'no-link';

export interface WanResponse {
  wanType: WanInterfaceType;
  interface: string;
  interfaceType: string;
  macvlan?: string;
  ssid?: string;
  password?: string;
  authType?: WanAuthType;
  status?: WanStatus | string;
  addressType?: 'dhcp' | 'static';
  /** Static addresses carry their prefix (`10.42.0.2/24`); DHCP ones do not. */
  ip?: string;
  gateway?: string;
  enabled: boolean;
  comment?: string;
}

export interface RemoveWanResponse {
  interface: string;
  type: WanInterfaceType;
}

export async function fetchWans(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<WanResponse[]> {
  const list = await apiRequest<WanResponse[] | null>('/api/interface/wans', {
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function fetchWan(
  creds: SystemCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<WanResponse> {
  return apiRequest<WanResponse>(`/api/interface/wan/${encodeURIComponent(name)}`, {
    auth: creds,
    cache: 'no-store',
    signal,
  });
}

export async function removeWanInterface(
  creds: SystemCredentials,
  name: string,
): Promise<RemoveWanResponse> {
  return apiRequest<RemoveWanResponse>(`/api/interface/wan/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    auth: creds,
  });
}

export async function updateWanInterface(
  creds: SystemCredentials,
  request: UpdateWanInterfaceRequest,
): Promise<void> {
  await apiRequest<unknown>('/api/interface/wan', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify(request),
  });
}

export interface BridgeResponse {
  id: string;
  name: string;
  disabled?: boolean;
  comment?: string;
}

export interface BridgePortResponse {
  id: string;
  bridge: string;
  interface: string;
  disabled?: boolean;
  edge?: string;
  pathCost?: number;
  comment?: string;
}

export interface UpdateInterfaceBridgeRequest {
  interface: string;
  bridge: string;
}

export async function fetchBridges(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<BridgeResponse[]> {
  const list = await apiRequest<BridgeResponse[] | null>('/api/interface/bridges', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function fetchBridgePorts(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<BridgePortResponse[]> {
  const list = await apiRequest<BridgePortResponse[] | null>('/api/interface/bridge/ports', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function updateInterfaceBridge(
  creds: SystemCredentials,
  request: UpdateInterfaceBridgeRequest,
): Promise<void> {
  await apiRequest<unknown>('/api/interface/bridge/port', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify(request),
  });
}

export interface ForeignGatewayResponse {
  gateway: string | null;
}

export async function fetchForeignGateway(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<string | null> {
  const data = await apiRequest<ForeignGatewayResponse | null>('/api/route/foreign-gateway', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return data?.gateway ?? null;
}

export async function updateForeignGateway(
  creds: SystemCredentials,
  gateway: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<unknown>('/api/route/foreign-gateway', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify({ gateway }),
    signal,
  });
}

export async function fetchVPNClients(
  creds: SystemCredentials,
  signal?: AbortSignal,
): Promise<VPNActiveClient[]> {
  const clients = await apiRequest<VPNActiveClient[] | null>('/api/vpn/clients', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
  return clients ?? [];
}

export async function setSystemIdentity(creds: SystemCredentials, name: string): Promise<void> {
  await apiRequest<void>('/api/system/identity', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify({ name }),
  });
}

export async function rebootSystem(creds: SystemCredentials): Promise<void> {
  await apiRequest<void>('/api/system/reboot', {
    method: 'POST',
    auth: creds,
  });
}

export async function changeUserPassword(
  creds: SystemCredentials,
  newPassword: string,
): Promise<void> {
  await apiRequest<void>('/api/system/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify({ username: creds.username, newPassword }),
  });
}

export async function shutdownSystem(creds: SystemCredentials): Promise<void> {
  await apiRequest<void>('/api/system/shutdown', {
    method: 'POST',
    auth: creds,
  });
}

export async function fetchInterfaceGraph(
  creds: SystemCredentials,
  interfaceName: string,
  signal?: AbortSignal,
): Promise<InterfaceGraphResponse> {
  return apiRequest<InterfaceGraphResponse>(
    `/api/interface/graph/${encodeURIComponent(interfaceName)}`,
    {
      method: 'GET',
      auth: creds,
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
    serial: info.systemId || '',
    temperatureC: 0,
    interfaceCount: 0,
    ...dynamic,
  };
}

export interface SchedulerResponse {
  name: string;
  enabled: boolean;
  startDate: string;
  /** `HH:MM:SS`, or `startup`. */
  startTime: string;
  /** Clock form with weeks summed into days, e.g. `7d 00:00:00` or `01:00:00`. */
  interval: string;
  runCount: number;
  nextRun: string;
}

export interface UpdateSchedulerRequest {
  startTime?: string;
  interval?: string;
}

export async function fetchScheduler(
  creds: SystemCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<SchedulerResponse> {
  return apiRequest<SchedulerResponse>(`/api/system/scheduler/${encodeURIComponent(name)}`, {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
}

export async function updateScheduler(
  creds: SystemCredentials,
  name: string,
  request: UpdateSchedulerRequest,
): Promise<void> {
  await apiRequest<unknown>(`/api/system/scheduler/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    auth: creds,
    body: JSON.stringify(request),
  });
}
