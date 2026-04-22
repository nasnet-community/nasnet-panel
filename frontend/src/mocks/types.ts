export type RouterStatus = 'online' | 'offline' | 'unknown' | 'degraded';
export type RouterPlatform = 'mikrotik' | 'openwrt' | 'vyos';

export interface Router {
  id: string;
  name: string;
  host: string;
  port: number;
  platform: RouterPlatform;
  model?: string;
  version?: string;
  status: RouterStatus;
  lastSeen?: string;
  createdAt: string;
  configurationAppliedAt?: string;
}

export interface RouterInfo {
  model: string;
  version: string;
  cpuLoad: number;
  uptime: string;
}

export interface AddRouterInput {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface DiscoveredDevice {
  ip: string;
  hostname?: string;
  vendor: string;
  type: string;
  ports: number[];
  services: string[];
}

export interface ScanProgressEvent {
  taskId: string;
  percent: number;
  found: DiscoveredDevice[];
  done: boolean;
}

export interface Interface {
  name: string;
  type: 'ether' | 'wireless' | 'bridge' | 'vlan';
  mac: string;
  running: boolean;
  comment?: string;
}

export interface SystemOverview {
  routerId: string;
  model: string;
  version: string;
  serial: string;
  uptime: string;
  cpuLoad: number;
  memoryUsed: number;
  memoryTotal: number;
  temperatureC: number;
  interfaceCount: number;
  dhcpLeases: number;
  vpnTunnels: number;
}

export interface TrafficSample {
  t: number;
  rxKbps: number;
  txKbps: number;
}

export interface ResourceSample {
  t: number;
  cpu: number;
  memoryPct: number;
}

export interface TopClient {
  ip: string;
  hostname: string;
  mac: string;
  totalKbps: number;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  routerId: string;
  ts: string;
  level: LogLevel;
  topic: string;
  message: string;
}

export type WirelessSecurity = 'WPA2-PSK' | 'WPA3-PSK' | 'open';
export type WirelessBand = '2.4ghz' | '5ghz';

export interface WirelessSettings {
  ssid: string;
  password: string;
  security: WirelessSecurity;
  band: WirelessBand;
  countryCode: string;
  hidden: boolean;
}

export interface WirelessClient {
  mac: string;
  hostname: string;
  ip: string;
  signalDbm: number;
  band: WirelessBand;
  txKbps: number;
  rxKbps: number;
  connectedFor: string;
}

export type VPNProtocol = 'wireguard' | 'l2tp' | 'openvpn' | 'pptp' | 'sstp' | 'ikev2';

export interface VPNClient {
  id: string;
  routerId: string;
  name: string;
  protocol: VPNProtocol;
  enabled: boolean;
  endpoint?: string;
  endpointPort?: number;
  username?: string;
  comment?: string;
}

export interface VPNServer {
  id: string;
  routerId: string;
  name: string;
  protocol: VPNProtocol;
  listenPort: number;
  ipPool: string;
  dns?: string;
  running: boolean;
}

export interface VPNPeer {
  id: string;
  serverId: string;
  routerId: string;
  name: string;
  allowedIps: string;
  publicKey: string;
  privateKey?: string;
  enabled: boolean;
  lastHandshake?: string;
}

export type RouterUserGroup = 'full' | 'read' | 'write';

export interface RouterUser {
  id: string;
  routerId: string;
  name: string;
  group: RouterUserGroup;
  disabled: boolean;
  lastLogin?: string;
}

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  changelog: string;
  updateAvailable: boolean;
}

export interface FirmwareUpdateInfo {
  routerId: string;
  currentChannel: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

export interface BatchJobResult {
  status: 'ok' | 'error';
  appliedLines: number;
  errors?: Array<{ line: number; message: string }>;
}
