import { apiRequest } from './http';

export interface VPNCredentials {
  host: string;
  username: string;
  password: string;
}

export interface VPNClientResponse {
  id: string;
  name: string;
  type: string;
  running: boolean;
  disabled: boolean;
  mtu: number;
  macAddress: string;
  rxByte: number;
  txByte: number;
  rxPacket: number;
  txPacket: number;
  lastLinkUp: string;
  lastLinkDown: string;
  linkDowns: number;
  comment?: string;
}

export interface UpdateVPNClientRequest {
  disabled?: boolean;
  comment?: string;
}

export interface AddL2TPClientRequest {
  name: string;
  connectTo: string;
  user: string;
  password: string;
  disabled?: boolean;
  ipsecSecret?: string;
}

export interface UpdateL2TPClientRequest {
  connectTo?: string;
  user?: string;
  password?: string;
  disabled?: boolean;
  ipsecSecret?: string;
}

export interface ServerStatusItem {
  name: string;
  enabled: boolean;
  port?: number;
  localIp?: string;
  localIpPool?: string;
  remoteIp?: string;
  remoteIpPool?: string;
}

export interface SingleServerStatus {
  enabled: boolean;
  port?: number;
  localIp?: string;
  localIpPool?: string;
  remoteIp?: string;
  remoteIpPool?: string;
}

export interface VPNServersStatusResponse {
  ovpnServers: ServerStatusItem[];
  wireguards: ServerStatusItem[];
  pptp: SingleServerStatus | null;
  l2tp: SingleServerStatus | null;
  sstp: SingleServerStatus | null;
}

export interface OvpnServerDetailsResponse {
  name: string;
  port: number;
  mode: string;
  protocol: string;
  macAddress: string;
  certificate: string;
  requireClientCertificate: boolean;
  auth: string;
  cipher: string;
  userAuthMethod: string;
  enabled: boolean;
}

export interface L2TPUserSecret {
  username: string;
  password: string;
}

export interface PptpServerDetailsResponse {
  enabled: boolean;
  auth: string;
  profile: string;
  localAddress: string;
  remoteAddress: string;
  useCompression: string;
  useEncryption: string;
  onlyOne: string;
  changeTcpMss: string;
  dnsServer: string;
  secrets: L2TPUserSecret[];
}

export interface L2tpServerDetailsResponse {
  enabled: boolean;
  auth: string;
  profile: string;
  ipsec: string;
  ipsecSecret: string;
  oneSessionPerHost: boolean;
  protocol: string;
  localAddress: string;
  remoteAddress: string;
  useCompression: string;
  useEncryption: string;
  onlyOne: string;
  changeTcpMss: string;
  dnsServer: string;
  secrets: L2TPUserSecret[];
}

export interface SstpServerDetailsResponse {
  enabled: boolean;
  port: number;
  profile: string;
  auth: string;
  certificate: string;
  verifyClientCertificate: boolean;
  tlsVersion: string;
  ciphers: string;
  pfs: string;
  localAddress: string;
  remoteAddress: string;
  useCompression: string;
  useEncryption: string;
  onlyOne: string;
  changeTcpMss: string;
  dnsServer: string;
  secrets: L2TPUserSecret[];
}

export interface WireguardServerDetailsResponse {
  id: string;
  name: string;
  port: number;
  privateKey: string;
  publicKey: string;
  running: boolean;
  enabled: boolean;
}

function authHeaders({ host, username, password }: VPNCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function listVPNClients(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<VPNClientResponse[]> {
  const data = await apiRequest<VPNClientResponse[] | null>('/api/vpn/clients', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}

export async function updateVPNClient(
  creds: VPNCredentials,
  name: string,
  body: UpdateVPNClientRequest,
  signal?: AbortSignal,
): Promise<VPNClientResponse> {
  return apiRequest<VPNClientResponse>(`/api/vpn/clients/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function addL2TPClient(
  creds: VPNCredentials,
  body: AddL2TPClientRequest,
  signal?: AbortSignal,
): Promise<VPNClientResponse> {
  return apiRequest<VPNClientResponse>('/api/vpn/l2tp-client', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function updateL2TPClient(
  creds: VPNCredentials,
  nameOrID: string,
  body: UpdateL2TPClientRequest,
  signal?: AbortSignal,
): Promise<VPNClientResponse> {
  return apiRequest<VPNClientResponse>(
    `/api/vpn/l2tp-client/${encodeURIComponent(nameOrID)}`,
    {
      method: 'PUT',
      headers: authHeaders(creds),
      body: JSON.stringify(body),
      signal,
    },
  );
}

export async function deleteL2TPClient(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/api/vpn/l2tp-client/${encodeURIComponent(nameOrID)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchVPNServersStatus(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<VPNServersStatusResponse> {
  const data = await apiRequest<VPNServersStatusResponse | null>('/api/vpn/servers', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return (
    data ?? {
      ovpnServers: [],
      wireguards: [],
      pptp: null,
      l2tp: null,
      sstp: null,
    }
  );
}

export async function fetchOvpnServerDetails(
  creds: VPNCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<OvpnServerDetailsResponse> {
  return apiRequest<OvpnServerDetailsResponse>(`/api/vpn/ovpn-server/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchPptpServerDetails(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<PptpServerDetailsResponse> {
  return apiRequest<PptpServerDetailsResponse>('/api/vpn/pptp-server', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchL2tpServerDetails(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<L2tpServerDetailsResponse> {
  return apiRequest<L2tpServerDetailsResponse>('/api/vpn/l2tp-server', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchSstpServerDetails(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<SstpServerDetailsResponse> {
  return apiRequest<SstpServerDetailsResponse>('/api/vpn/sstp-server', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function fetchWireguardServerDetails(
  creds: VPNCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<WireguardServerDetailsResponse> {
  return apiRequest<WireguardServerDetailsResponse>(
    `/api/vpn/wireguard-server/${encodeURIComponent(name)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}
