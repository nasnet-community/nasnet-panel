/**
 * Firewall configuration types
 * Handles filter rules, NAT rules, mangle rules, and routing
 */

export type FirewallChain = 'input' | 'forward' | 'output' | 'prerouting' | 'postrouting';
export type FirewallAction = 'accept' | 'drop' | 'reject' | 'log';
export type FirewallProtocol = 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all';

export interface FirewallRule {
  id: string;
  disabled: boolean;
  chain: FirewallChain;
  action: FirewallAction;
  comment?: string;
  protocol?: FirewallProtocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  srcAddressList?: string;
  dstAddressList?: string;
  connectionState?: string[]; // Will be imported from firewall types
  log?: boolean;
  logPrefix?: string;
  packets?: number;
  bytes?: number;
  inInterfaceList?: string;
  outInterfaceList?: string;
  order: number;
}

export interface NATRule {
  id: string;
  disabled: boolean;
  chain: Exclude<FirewallChain, 'input' | 'forward' | 'output'>;
  action: 'src-nat' | 'dst-nat' | 'masquerade' | 'redirect';
  comment?: string;
  protocol?: FirewallProtocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  toAddresses?: string;
  toPorts?: string;
  order: number;
}

export interface MangleRule {
  id: string;
  disabled: boolean;
  chain: FirewallChain;
  action: 'mark-connection' | 'mark-packet' | 'set-priority' | 'set-dscp';
  comment?: string;
  protocol?: FirewallProtocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  newMark?: string;
  newPriority?: string;
  newDscp?: string;
  order: number;
}

export interface RouteEntry {
  id: string;
  disabled: boolean;
  destination: string; // CIDR format
  gateway?: string;
  interface?: string;
  distance: number;
  routeType: 'unicast' | 'blackhole' | 'unreachable' | 'prohibit';
  dynamic: boolean;
  active: boolean;
}

export interface RoutingTable {
  routes: RouteEntry[];
}

export interface AddressList {
  id: string;
  name: string;
  address: string; // CIDR format
  comment?: string;
  disabled: boolean;
}

/**
 * Router service configuration (API, SSH, Winbox, WWW, etc.)
 * Endpoint: GET /rest/ip/service
 */
export interface RouterService {
  id: string;
  name: string; // api, api-ssl, ftp, ssh, telnet, winbox, www, www-ssl
  port: number;
  disabled: boolean;
  address?: string; // allowed addresses restriction
  certificate?: string; // for SSL services
}

/**
 * Filter options for firewall rule search
 */
export interface FirewallFilters {
  search?: string;
  chain?: FirewallChain | 'all';
  action?: FirewallAction | 'all';
  protocol?: FirewallProtocol | 'all';
  status?: 'enabled' | 'disabled' | 'all';
}

/**
 * Chain summary statistics
 */
export interface ChainSummary {
  chain: FirewallChain;
  totalRules: number;
  acceptCount: number;
  dropCount: number;
  rejectCount: number;
  logCount: number;
  disabledCount: number;
}

/**
 * Connection tracking state for active connections
 * More detailed than ConnectionState (which is used for mangle rule matching)
 * Includes TCP-specific states for connection tracking table
 */
export type ConnectionTrackingState =
  | 'established'
  | 'new'
  | 'related'
  | 'invalid'
  | 'time-wait'
  | 'syn-sent'
  | 'syn-received'
  | 'fin-wait'
  | 'close-wait'
  | 'last-ack'
  | 'close';

/**
 * Active connection entry from connection tracking table
 * Endpoint: GET /rest/ip/firewall/connection
 */
export interface Connection {
  id: string;
  protocol: 'tcp' | 'udp' | 'icmp' | 'gre' | string;
  srcAddress: string;
  srcPort?: number;
  dstAddress: string;
  dstPort?: number;
  replyDstAddress?: string;
  replyDstPort?: number;
  state: ConnectionTrackingState;
  timeout: string; // Duration string like "23h59m59s"
  packets: number;
  bytes: number;
  assured?: boolean;
  confirmed?: boolean;
}

/**
 * Connection tracking settings
 * Endpoint: GET /rest/ip/firewall/connection/tracking
 */
export interface ConnectionTrackingSettings {
  enabled: boolean;
  maxEntries: number;
  genericTimeout: number; // seconds
  tcpEstablishedTimeout: number;
  tcpTimeWaitTimeout: number;
  tcpCloseTimeout: number;
  tcpSynSentTimeout: number;
  tcpSynReceivedTimeout: number;
  tcpFinWaitTimeout: number;
  tcpCloseWaitTimeout: number;
  tcpLastAckTimeout: number;
  udpTimeout: number;
  udpStreamTimeout: number;
  icmpTimeout: number;
  looseTracking: boolean;
}

/**
 * Filter options for connection search
 */
export interface ConnectionFilters {
  ipAddress?: string; // Supports wildcards like 192.168.1.*
  port?: number;
  protocol?: string;
  state?: ConnectionTrackingState;
}
