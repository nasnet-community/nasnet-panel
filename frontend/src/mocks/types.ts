export type RouterStatus = 'online' | 'offline' | 'unknown' | 'degraded';
export type RouterPlatform = 'mikrotik' | 'openwrt' | 'vyos';

export interface Router {
  id: string;
  name: string;
  host: string;
  hostname?: string;
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
  disabled?: boolean;
  comment?: string;
  speed?: string;
  ssid?: string;
  band?: WirelessBand;
  securityTypes?: string[];
  mode?: string;
}

export interface SystemOverview {
  routerId: string;
  identity: string;
  model: string;
  version: string;
  buildTime: string;
  updateChannel: string;
  license: string;
  serial: string;
  uptime: string;
  cpuLoad: number;
  cpuCount: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  memoryUsedLabel: string;
  memoryTotalLabel: string;
  hddUsedBytes: number;
  hddTotalBytes: number;
  hddUsedLabel: string;
  hddTotalLabel: string;
  temperatureC: number;
  interfaceCount: number;
  dhcpLeases: number;
  vpnTunnels: number;
}

export type VPNProtocolLabel =
  | 'ppp'
  | 'wireguard'
  | 'ipsec'
  | 'l2tp-client'
  | 'pptp-client'
  | 'ovpn-client'
  | 'sstp-client';

export interface VPNActiveClient {
  id: string;
  protocol: VPNProtocolLabel;
  name: string;
  service?: string;
  address?: string;
  uptime?: string;
  rxBytes?: number;
  txBytes?: number;
  callerId?: string;
  interface?: string;
}

export interface TrafficSample {
  t: number;
  rxKbps: number;
  txKbps: number;
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

export type WirelessBand = '2.4ghz' | '5ghz' | '6ghz';

export interface WirelessSettings {
  ssid: string;
  password: string;
  securityTypes: string[];
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
  running: boolean;
  lastLinkUp?: string;
  lastLinkDown?: string;
  rxByte?: number;
  txByte?: number;
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
  transport?: string;
  listenPort: number;
  ipPool: string;
  localIp?: string;
  localIpPool?: string;
  remoteIp?: string;
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

export type RoutingNodeKind = 'group' | 'router' | 'wan' | 'vpn';
export type RoutingWanKind = 'starlink' | 'mobile' | 'fiber' | 'ether' | 'other';

export interface RoutingNode {
  id: string;
  kind: RoutingNodeKind;
  label: string;
  wanKind?: RoutingWanKind;
  protocol?: VPNProtocol;
  subnet?: string;
}

export interface RoutingHop {
  id: string;
  fromId: string;
  toId: string;
  isActive: boolean;
}

export interface RoutingTopology {
  routerId: string;
  nodes: RoutingNode[];
  hops: RoutingHop[];
}
