import { apiRequest } from './http';

export interface WifiCredentials {
  host: string;
  username: string;
  password: string;
}

export interface WifiInterfaceResponse {
  id: string;
  name: string;
  interface: string;
  ssid: string;
  frequency: string;
  channelWidth: string;
  macAddress: string;
  disabled: boolean;
  running: boolean;
  inactive: boolean;
  passphrase?: string;
  mode?: string;
  band?: string;
  securityType?: string;
  comment?: string;
}

export interface WifiConnectedClientResponse {
  id: string;
  macAddress: string;
  ssid: string;
  interface: string;
  uptime: string;
  lastActivity: string;
  signal: string;
  authType: string;
  band: string;
  txRate: string;
  rxRate: string;
  txPackets: string;
  rxPackets: string;
  txBytes: string;
  rxBytes: string;
  txBitsPerSecond: string;
  rxBitsPerSecond: string;
  authorized: boolean;
}

export interface WifiPassphraseResponse {
  interfaceName: string;
  passphrase: string;
}

function authHeaders({ host, username, password }: WifiCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchWifiInterfaces(
  creds: WifiCredentials,
  signal?: AbortSignal,
): Promise<WifiInterfaceResponse[]> {
  const list = await apiRequest<WifiInterfaceResponse[] | null>('/api/wifi/interfaces', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function fetchWifiInterface(
  creds: WifiCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<WifiInterfaceResponse> {
  return apiRequest<WifiInterfaceResponse>(`/api/wifi/interfaces/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchWifiClients(
  creds: WifiCredentials,
  interfaceName?: string,
  signal?: AbortSignal,
): Promise<WifiConnectedClientResponse[]> {
  const query = interfaceName ? `?interface=${encodeURIComponent(interfaceName)}` : '';
  const list = await apiRequest<WifiConnectedClientResponse[] | null>(`/api/wifi/clients${query}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return list ?? [];
}

export async function updateWifiInterface(
  creds: WifiCredentials,
  name: string,
  enabled: boolean,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest(`/api/wifi/interfaces/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify({ enabled }),
    signal,
  });
}

export async function removeWifiClient(
  creds: WifiCredentials,
  mac: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest(`/api/wifi/clients/${encodeURIComponent(mac)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    signal,
  });
}

export async function fetchWifiPassphrase(
  creds: WifiCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<WifiPassphraseResponse> {
  return apiRequest<WifiPassphraseResponse>(`/api/wifi/passphrase/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function updateWifiPassphrase(
  creds: WifiCredentials,
  name: string,
  passphrase: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest(`/api/wifi/passphrase/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify({ passphrase }),
    signal,
  });
}
