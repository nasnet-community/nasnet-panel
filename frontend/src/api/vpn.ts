import { BACKEND_URL } from './config';
import { ApiError, apiRequest } from './http';

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

export interface L2TPClientDetailsResponse {
  id: string;
  name: string;
  disabled: boolean;
  running: boolean;
  maxMtu: number;
  maxMru: number;
  mrru: string;
  connectTo: string;
  user: string;
  password: string;
  profile: string;
  keepaliveTimeout: number;
  usePeerDns: boolean;
  useIPsec: boolean;
  ipsecSecret: string;
  allowFastPath: boolean;
  addDefaultRoute: boolean;
  dialOnDemand: boolean;
  allow: string;
  randomSourcePort: boolean;
  l2tpProtoVersion: string;
  l2tpv3DigestHash: string;
  addRoutes: boolean;
  comment: string;
  status: string;
  uptime: string;
  encoding: string;
  mtu: number;
  localAddress: string;
  remoteAddress: string;
  localIpv6Address: string;
  remoteIpv6Address: string;
}

export interface ServerStatusItem {
  name: string;
  enabled: boolean;
  port?: number;
  protocol?: string;
  localIp?: string;
  localIpPool?: string;
  remoteIp?: string;
  remoteIpPool?: string;
}

export interface SingleServerStatus {
  enabled: boolean;
  port?: number;
  protocol?: string;
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
  protocol: string;
  certificate: string;
  requireClientCertificate: boolean;
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

export interface VpnUser {
  username: string;
  password: string;
}

export interface CreateOvpnServerRequest {
  clientCertificatePassword: string;
  users: VpnUser[];
}

export interface CreateOvpnServerResponse {
  taskId: string;
  status: string;
}

export interface OvpnServerTaskStatus {
  taskId: string;
  status: 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  startTime: number;
  completedTime?: number;
  error?: string;
  result?: Record<string, unknown>;
}

export interface UpdateOvpnServerEnabledRequest {
  enabled: boolean;
}

export interface UpdateOvpnServerEnabledResponse {
  name: string;
  enabled: boolean;
}

export interface CreateSstpServerRequest {
  enabled: boolean;
}

export interface CreateSstpServerResponse {
  taskId: string;
  status: string;
}

export interface SstpServerTaskStatus {
  taskId: string;
  status: 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  startTime: number;
  completedTime?: number;
  error?: string;
  result?: Record<string, unknown>;
}

export interface CreateWireguardServerRequest {
  name: string;
  localAddress?: string;
  mtu?: number;
  listenPort?: number;
  privateKey?: string;
  disabled?: boolean;
  comment?: string;
}

export interface CreateWireguardServerResponse {
  id: string;
  name: string;
  localAddress: string;
  mtu: number;
  listenPort: number;
  publicKey: string;
  privateKey: string;
  disabled: boolean;
  comment: string;
}

export interface UpdateWireguardInterfaceRequest {
  disabled?: boolean;
  comment?: string;
  mtu?: number;
  listenPort?: number;
  privateKey?: string;
}

export interface WireguardPeerResponse {
  id: string;
  name: string;
  interfaceName: string;
  publicKey: string;
  privateKey?: string;
  endpointAddress: string;
  endpointPort: number;
  currentEndpointAddress: string;
  currentEndpointPort: number;
  allowedAddresses: string;
  preSharedKey?: string;
  persistentKeepalive: string;
  clientEndpoint?: string;
  clientAllowedAddress?: string;
  lastHandshake: string;
  rxBytes: number;
  txBytes: number;
  rx: string;
  tx: string;
  dynamic: boolean;
  disabled: boolean;
}

export interface WireguardDetailedResponse {
  id: string;
  name: string;
  running: boolean;
  disabled: boolean;
  mtu: number;
  macAddress: string;
  publicKey: string;
  privateKey: string;
  listenPort: number;
  comment: string;
  peers: WireguardPeerResponse[];
}

export interface CreateWireguardPeerRequest {
  interfaceName: string;
  name?: string;
  endpointAddress?: string;
  endpointPort?: number;
  allowedAddresses: string;
  privateKey?: string;
  publicKey?: string;
  preSharedKey?: string;
  persistentKeepalive?: number;
  savePrivateKey?: boolean;
  disabled?: boolean;
  clientEndpoint?: string;
  clientAddress?: string;
  clientKeepalive?: number;
  clientAllowedAddress?: string;
  clientListenPort?: number;
  clientDNS?: string;
  comment?: string;
  responder?: boolean;
}

export interface CreateWireguardPeerResponse {
  name: string;
  interfaceName: string;
  publicKey: string;
  privateKey: string;
  preSharedKey: string;
  endpointAddress: string;
  endpointPort: number;
  allowedAddresses: string;
  persistentKeepalive: number;
  disabled: boolean;
}

export interface UpdateWireguardPeerRequest {
  name?: string;
  endpointAddress?: string;
  endpointPort?: number;
  allowedAddresses?: string;
  privateKey?: string;
  publicKey?: string;
  preSharedKey?: string;
  persistentKeepalive?: number;
  disabled?: boolean;
  clientEndpoint?: string;
  clientAddress?: string;
  clientKeepalive?: number;
  clientAllowedAddress?: string;
  clientListenPort?: number;
  clientDNS?: string;
  comment?: string;
  responder?: boolean;
}

export interface CreateWireguardClientRequest {
  name: string;
  interfaceLocalAddress: string;
  endpointIP: string;
  endpointPort: number;
  allowedAddress: string;
  mtu?: number;
  listenPort?: number;
  interfacePrivateKey?: string;
  disabled?: boolean;
  comment?: string;
  peerPublicKey?: string;
  peerPrivateKey?: string;
  presharedKey?: string;
  persistentKeepalive?: number;
}

export interface CreateWireguardClientResponse {
  id: string;
  name: string;
  mtu: number;
  listenPort: number;
  interfacePrivateKey: string;
  interfacePublicKey: string;
  interfaceLocalAddress: string;
  disabled: boolean;
  peerName: string;
  peerPublicKey: string;
  peerPrivateKey: string;
  endpointIP: string;
  endpointPort: number;
  allowedAddress: string;
}

export interface ImportWireguardConfigRequest {
  interfaceName: string;
  config: string;
}

export interface ImportWireguardConfigResponse {
  interfaceName: string;
  interfaceIP: string;
  peerName: string;
}

function authHeaders({ host, username, password }: VPNCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export interface NasnetVpnCredentialsResponse {
  username: string;
  password: string;
  server: string;
  expiryDate?: string;
}

export async function fetchNasnetVpnCredentials(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<NasnetVpnCredentialsResponse> {
  return apiRequest<NasnetVpnCredentialsResponse>('/api/wizard/vpn', {
    method: 'POST',
    headers: authHeaders(creds),
    body: '{}',
    signal,
  });
}

export interface FinalizeWizardInterface {
  interface: string;
  ssid?: string;
  password?: string;
}

export interface FinalizeWizardL2tpClient {
  connectTo: string;
  user: string;
  password: string;
  ipsecSecret: string;
}

export interface FinalizeWizardWireGuardClient {
  config: string;
}

export interface FinalizeWizardWifiAp {
  ssid: string;
  password: string;
  split: boolean;
}

export interface FinalizeWizardOvpnUser {
  username: string;
  password: string;
}

export interface FinalizeWizardOvpnServer {
  clientCertificatePassword: string;
  users: FinalizeWizardOvpnUser[];
}

export interface FinalizeWizardRequest {
  foreign: FinalizeWizardInterface;
  domestic?: FinalizeWizardInterface;
  l2tpClient?: FinalizeWizardL2tpClient;
  wireguardClient?: FinalizeWizardWireGuardClient;
  wifiAp?: FinalizeWizardWifiAp;
  ovpnServer?: FinalizeWizardOvpnServer;
}

export interface FinalizeWizardResponse {
  managementWiFiSSID?: string;
  managementWiFiPassword?: string;
}

export async function finalizeWizard(
  creds: VPNCredentials,
  body: FinalizeWizardRequest,
  signal?: AbortSignal,
): Promise<FinalizeWizardResponse> {
  return apiRequest<FinalizeWizardResponse>('/api/wizard/finalize', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export interface WizardStatus {
  completed: boolean;
  progress: number;
}

export async function fetchWizardStatus(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<WizardStatus> {
  return apiRequest<WizardStatus>('/api/wizard/status', {
    headers: authHeaders(creds),
    signal,
  });
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
  return apiRequest<VPNClientResponse>('/api/vpn/l2tp/client', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function fetchL2TPClientDetails(
  creds: VPNCredentials,
  name: string,
  signal?: AbortSignal,
): Promise<L2TPClientDetailsResponse> {
  return apiRequest<L2TPClientDetailsResponse>(`/api/vpn/l2tp/client/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function updateL2TPClient(
  creds: VPNCredentials,
  nameOrID: string,
  body: UpdateL2TPClientRequest,
  signal?: AbortSignal,
): Promise<VPNClientResponse> {
  return apiRequest<VPNClientResponse>(`/api/vpn/l2tp/client/${encodeURIComponent(nameOrID)}`, {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function deleteL2TPClient(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/api/vpn/l2tp/client/${encodeURIComponent(nameOrID)}`, {
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
  return apiRequest<OvpnServerDetailsResponse>(`/api/vpn/ovpn/server/${encodeURIComponent(name)}`, {
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
  return apiRequest<PptpServerDetailsResponse>('/api/vpn/pptp/server', {
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
  return apiRequest<L2tpServerDetailsResponse>('/api/vpn/l2tp/server', {
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
  return apiRequest<SstpServerDetailsResponse>('/api/vpn/sstp/server', {
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
    `/api/vpn/wireguard/interface/${encodeURIComponent(name)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export async function createOvpnServer(
  creds: VPNCredentials,
  body: CreateOvpnServerRequest,
  signal?: AbortSignal,
): Promise<CreateOvpnServerResponse> {
  return apiRequest<CreateOvpnServerResponse>('/api/vpn/ovpn/server', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function fetchOvpnServerTaskStatus(
  creds: VPNCredentials,
  taskId: string,
  signal?: AbortSignal,
): Promise<OvpnServerTaskStatus> {
  return apiRequest<OvpnServerTaskStatus>(
    `/api/vpn/ovpn/server/status/${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export async function updateOvpnServerEnabled(
  creds: VPNCredentials,
  name: string,
  body: UpdateOvpnServerEnabledRequest,
  signal?: AbortSignal,
): Promise<UpdateOvpnServerEnabledResponse> {
  return apiRequest<UpdateOvpnServerEnabledResponse>(
    `/api/vpn/ovpn/server/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      headers: authHeaders(creds),
      body: JSON.stringify(body),
      signal,
    },
  );
}

export async function deleteOvpnServer(
  creds: VPNCredentials,
  name: string,
  deleteCertificateFiles = false,
  signal?: AbortSignal,
): Promise<void> {
  const query = deleteCertificateFiles ? '?deleteCertificateFiles=true' : '';
  await apiRequest<void>(`/api/vpn/ovpn/server/${encodeURIComponent(name)}${query}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    signal,
  });
}

export async function createSstpServer(
  creds: VPNCredentials,
  body: CreateSstpServerRequest,
  signal?: AbortSignal,
): Promise<CreateSstpServerResponse> {
  return apiRequest<CreateSstpServerResponse>('/api/vpn/sstp/server', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function fetchSstpServerTaskStatus(
  creds: VPNCredentials,
  taskId: string,
  signal?: AbortSignal,
): Promise<SstpServerTaskStatus> {
  return apiRequest<SstpServerTaskStatus>(
    `/api/vpn/sstp/server/status/${encodeURIComponent(taskId)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export async function createWireguardServer(
  creds: VPNCredentials,
  body: CreateWireguardServerRequest,
  signal?: AbortSignal,
): Promise<CreateWireguardServerResponse> {
  return apiRequest<CreateWireguardServerResponse>('/api/vpn/wireguard/server', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function updateWireguardInterface(
  creds: VPNCredentials,
  nameOrID: string,
  body: UpdateWireguardInterfaceRequest,
  signal?: AbortSignal,
): Promise<WireguardServerDetailsResponse> {
  return apiRequest<WireguardServerDetailsResponse>(
    `/api/vpn/wireguard/interface/${encodeURIComponent(nameOrID)}`,
    {
      method: 'PUT',
      headers: authHeaders(creds),
      body: JSON.stringify(body),
      signal,
    },
  );
}

export async function deleteWireguardInterface(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/api/vpn/wireguard/interface/${encodeURIComponent(nameOrID)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    signal,
  });
}

export async function fetchWireguardDetailed(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<WireguardDetailedResponse> {
  return apiRequest<WireguardDetailedResponse>(
    `/api/vpn/wireguard/detailed/${encodeURIComponent(nameOrID)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
}

export async function fetchWireguardPeers(
  creds: VPNCredentials,
  interfaceName: string,
  signal?: AbortSignal,
): Promise<WireguardPeerResponse[]> {
  const data = await apiRequest<WireguardPeerResponse[] | null>(
    `/api/vpn/wireguard/peers/${encodeURIComponent(interfaceName)}`,
    {
      method: 'GET',
      headers: authHeaders(creds),
      cache: 'no-store',
      signal,
    },
  );
  return data ?? [];
}

export async function createWireguardPeer(
  creds: VPNCredentials,
  body: CreateWireguardPeerRequest,
  signal?: AbortSignal,
): Promise<CreateWireguardPeerResponse> {
  return apiRequest<CreateWireguardPeerResponse>('/api/vpn/wireguard/peer', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function updateWireguardPeer(
  creds: VPNCredentials,
  nameOrID: string,
  body: UpdateWireguardPeerRequest,
  signal?: AbortSignal,
): Promise<WireguardPeerResponse | null> {
  return apiRequest<WireguardPeerResponse | null>(
    `/api/vpn/wireguard/peer/${encodeURIComponent(nameOrID)}`,
    {
      method: 'PUT',
      headers: authHeaders(creds),
      body: JSON.stringify(body),
      signal,
    },
  );
}

export async function deleteWireguardPeer(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/api/vpn/wireguard/peer/${encodeURIComponent(nameOrID)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    signal,
  });
}

export async function createWireguardClient(
  creds: VPNCredentials,
  body: CreateWireguardClientRequest,
  signal?: AbortSignal,
): Promise<CreateWireguardClientResponse> {
  return apiRequest<CreateWireguardClientResponse>('/api/vpn/wireguard/client', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function importWireguardConfig(
  creds: VPNCredentials,
  body: ImportWireguardConfigRequest,
  signal?: AbortSignal,
): Promise<ImportWireguardConfigResponse> {
  return apiRequest<ImportWireguardConfigResponse>('/api/vpn/wireguard/import-config', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function exportOvpnClient(
  creds: VPNCredentials,
  serverName: string,
  publicAddress: string,
  signal?: AbortSignal,
): Promise<{ filename: string; content: string }> {
  const params = new URLSearchParams({ name: serverName, publicAddress });
  const url = `${BACKEND_URL}/api/vpn/ovpn/server/export?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { ...authHeaders(creds), Accept: 'application/x-openvpn-profile, text/plain' },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error || body.message || message;
    } catch {
      // body wasn't JSON; keep default message
    }
    throw new ApiError(message, response.status);
  }
  const content = await response.text();
  const filename =
    parseFilename(response.headers.get('Content-Disposition')) ?? `${serverName}.ovpn`;
  return { filename, content };
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
  return match ? match[1] : null;
}

export interface VPNUserResponse {
  id: string;
  name: string;
  service: string;
  profile: string;
  password: string;
  disabled: boolean;
  limitBytesIn: number;
  limitBytesOut: number;
  callerId?: string;
  routes?: string;
  comment?: string;
}

export interface CreateVPNUserRequest {
  name: string;
  password: string;
  profile: string;
  disabled?: boolean;
  limitBytesIn?: number;
  limitBytesOut?: number;
  comment?: string;
}

export interface UpdateVPNUserRequest {
  name?: string;
  password?: string;
  profile?: string;
  disabled?: boolean;
  limitBytesIn?: number;
  limitBytesOut?: number;
  comment?: string;
}

export interface VPNProfileResponse {
  id: string;
  name: string;
  default: boolean;
  localAddress?: string;
  remoteAddress?: string;
  remoteAddressRange?: string[];
  dnsServer?: string;
  rateLimit?: string;
  sessionTimeout?: string;
  idleTimeout?: string;
  comment?: string;
}

export async function listVPNUsers(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<VPNUserResponse[]> {
  const data = await apiRequest<VPNUserResponse[] | null>('/api/vpn/users', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}

export async function createVPNUser(
  creds: VPNCredentials,
  body: CreateVPNUserRequest,
  signal?: AbortSignal,
): Promise<VPNUserResponse> {
  return apiRequest<VPNUserResponse>('/api/vpn/users', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function updateVPNUser(
  creds: VPNCredentials,
  nameOrID: string,
  body: UpdateVPNUserRequest,
  signal?: AbortSignal,
): Promise<VPNUserResponse> {
  return apiRequest<VPNUserResponse>(`/api/vpn/users/${encodeURIComponent(nameOrID)}`, {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function deleteVPNUser(
  creds: VPNCredentials,
  nameOrID: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/api/vpn/users/${encodeURIComponent(nameOrID)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function listVPNProfiles(
  creds: VPNCredentials,
  signal?: AbortSignal,
): Promise<VPNProfileResponse[]> {
  const data = await apiRequest<VPNProfileResponse[] | null>('/api/vpn/profiles', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}
