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
