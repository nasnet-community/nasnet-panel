import { makeRouterOSRequest } from './api';

import type { ApiResponse } from '@shared/routeros';

/**
 * Firewall Management Service
 * Provides access to firewall rules, NAT, address lists, and connections
 */

/** Firewall filter rule interface */
export interface FirewallRule {
  readonly id: string;
  readonly chain: 'input' | 'forward' | 'output';
  readonly action: 'accept' | 'drop' | 'reject' | 'return' | 'jump' | 'log' | 'passthrough';
  readonly protocol?: string;
  readonly srcAddress?: string;
  readonly dstAddress?: string;
  readonly srcPort?: string;
  readonly dstPort?: string;
  readonly inInterface?: string;
  readonly outInterface?: string;
  readonly connection?: string;
  readonly disabled?: boolean;
  readonly comment?: string;
  readonly bytes?: number;
  readonly packets?: number;
}

/** NAT rule interface */
export interface NATRule {
  readonly id: string;
  readonly chain: 'srcnat' | 'dstnat';
  readonly action: 'accept' | 'drop' | 'jump' | 'log' | 'masquerade' | 'netmap' | 'redirect' | 'return' | 'same' | 'src-nat' | 'dst-nat';
  readonly protocol?: string;
  readonly srcAddress?: string;
  readonly dstAddress?: string;
  readonly srcPort?: string;
  readonly dstPort?: string;
  readonly inInterface?: string;
  readonly outInterface?: string;
  readonly toAddresses?: string;
  readonly toPorts?: string;
  readonly disabled?: boolean;
  readonly comment?: string;
  readonly bytes?: number;
  readonly packets?: number;
}

/** Active connection interface */
export interface ActiveConnection {
  readonly protocol: string;
  readonly srcAddress: string;
  readonly srcPort: string;
  readonly dstAddress: string;
  readonly dstPort: string;
  readonly replyDstAddress: string;
  readonly replyDstPort: string;
  readonly replySrcAddress: string;
  readonly replySrcPort: string;
  readonly timeout: string;
  readonly connectionMark?: string;
  readonly assured?: boolean;
  readonly zone?: string;
}

/** Address list entry interface */
export interface AddressListEntry {
  readonly id: string;
  readonly list: string;
  readonly address: string;
  readonly disabled?: boolean;
  readonly comment?: string;
  readonly timeout?: string;
  readonly dynamic?: boolean;
}

/**
 * Get firewall filter rules
 * REST API endpoint: /rest/ip/firewall/filter
 */
export const getFirewallRules = async (routerIp: string): Promise<ApiResponse<FirewallRule[]>> => {
  return makeRouterOSRequest<FirewallRule[]>(routerIp, 'ip/firewall/filter');
};

/**
 * Get NAT rules
 * REST API endpoint: /rest/ip/firewall/nat
 */
export const getNATRules = async (routerIp: string): Promise<ApiResponse<NATRule[]>> => {
  return makeRouterOSRequest<NATRule[]>(routerIp, 'ip/firewall/nat');
};

/**
 * Get active connections
 * REST API endpoint: /rest/ip/firewall/connection
 */
export const getActiveConnections = async (routerIp: string): Promise<ApiResponse<ActiveConnection[]>> => {
  return makeRouterOSRequest<ActiveConnection[]>(routerIp, 'ip/firewall/connection');
};

/**
 * Get address list entries
 * REST API endpoint: /rest/ip/firewall/address-list
 */
export const getAddressLists = async (routerIp: string): Promise<ApiResponse<AddressListEntry[]>> => {
  return makeRouterOSRequest<AddressListEntry[]>(routerIp, 'ip/firewall/address-list');
};

/**
 * Toggle firewall rule enabled/disabled state
 * REST API endpoint: /rest/ip/firewall/filter/{id}
 */
export const toggleFirewallRule = async (
  routerIp: string,
  ruleId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/firewall/filter/${ruleId}`, {
    method: 'PATCH',
    body: { disabled: !enabled },
  });
};

/**
 * Toggle NAT rule enabled/disabled state
 * REST API endpoint: /rest/ip/firewall/nat/{id}
 */
export const toggleNATRule = async (
  routerIp: string,
  ruleId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/firewall/nat/${ruleId}`, {
    method: 'PATCH',
    body: { disabled: !enabled },
  });
};

/**
 * Add new firewall rule
 * REST API endpoint: /rest/ip/firewall/filter
 */
export const addFirewallRule = async (
  routerIp: string,
  rule: Partial<FirewallRule>
): Promise<ApiResponse<FirewallRule>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSRule: any = {};
  for (const [key, value] of Object.entries(rule)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSRule[kebabKey] = value;
  }

  return makeRouterOSRequest<FirewallRule>(routerIp, 'ip/firewall/filter', {
    method: 'POST',
    body: routerOSRule,
  });
};

/**
 * Add new NAT rule
 * REST API endpoint: /rest/ip/firewall/nat
 */
export const addNATRule = async (
  routerIp: string,
  rule: Partial<NATRule>
): Promise<ApiResponse<NATRule>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSRule: any = {};
  for (const [key, value] of Object.entries(rule)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSRule[kebabKey] = value;
  }

  return makeRouterOSRequest<NATRule>(routerIp, 'ip/firewall/nat', {
    method: 'POST',
    body: routerOSRule,
  });
};

/**
 * Delete firewall rule
 * REST API endpoint: /rest/ip/firewall/filter/{id}
 */
export const deleteFirewallRule = async (
  routerIp: string,
  ruleId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/firewall/filter/${ruleId}`, {
    method: 'DELETE',
  });
};

/**
 * Delete NAT rule
 * REST API endpoint: /rest/ip/firewall/nat/{id}
 */
export const deleteNATRule = async (
  routerIp: string,
  ruleId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/firewall/nat/${ruleId}`, {
    method: 'DELETE',
  });
};

/**
 * Add address to address list
 * REST API endpoint: /rest/ip/firewall/address-list
 */
export const addAddressListEntry = async (
  routerIp: string,
  entry: Partial<AddressListEntry>
): Promise<ApiResponse<AddressListEntry>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSEntry: any = {};
  for (const [key, value] of Object.entries(entry)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSEntry[kebabKey] = value;
  }

  return makeRouterOSRequest<AddressListEntry>(routerIp, 'ip/firewall/address-list', {
    method: 'POST',
    body: routerOSEntry,
  });
};

/**
 * Remove address from address list
 * REST API endpoint: /rest/ip/firewall/address-list/{id}
 */
export const removeAddressListEntry = async (
  routerIp: string,
  entryId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/firewall/address-list/${entryId}`, {
    method: 'DELETE',
  });
};

/**
 * Get firewall connection tracking statistics
 * REST API endpoint: /rest/ip/firewall/connection/tracking
 */
export const getConnectionTrackingStats = async (routerIp: string): Promise<ApiResponse<{
  maxEntries: number;
  totalEntries: number;
  tcpSynSent: number;
  tcpSynRecv: number;
  tcpEstablished: number;
  tcpFinWait: number;
  tcpCloseWait: number;
  tcpLastAck: number;
  tcpTimeWait: number;
  tcpClose: number;
}>> => {
  return makeRouterOSRequest(routerIp, 'ip/firewall/connection/tracking');
};

/**
 * Format firewall rule for display
 */
export const formatFirewallRule = (rule: FirewallRule): string => {
  const parts: string[] = [];
  
  if (rule.chain) parts.push(`chain=${rule.chain}`);
  if (rule.action) parts.push(`action=${rule.action}`);
  if (rule.protocol) parts.push(`protocol=${rule.protocol}`);
  if (rule.srcAddress) parts.push(`src-address=${rule.srcAddress}`);
  if (rule.dstAddress) parts.push(`dst-address=${rule.dstAddress}`);
  if (rule.srcPort) parts.push(`src-port=${rule.srcPort}`);
  if (rule.dstPort) parts.push(`dst-port=${rule.dstPort}`);
  if (rule.inInterface) parts.push(`in-interface=${rule.inInterface}`);
  if (rule.outInterface) parts.push(`out-interface=${rule.outInterface}`);
  
  return parts.join(' ');
};

/**
 * Get action color for styling
 */
export const getActionColor = (action: string): string => {
  switch (action.toLowerCase()) {
    case 'accept': return '#28a745';
    case 'drop': return '#dc3545';
    case 'reject': return '#fd7e14';
    case 'log': return '#17a2b8';
    case 'jump': return '#6f42c1';
    case 'return': return '#6c757d';
    case 'masquerade': return '#007bff';
    case 'src-nat':
    case 'dst-nat': return '#20c997';
    case 'redirect': return '#e83e8c';
    default: return '#6c757d';
  }
};

/**
 * Get chain color for styling
 */
export const getChainColor = (chain: string): string => {
  switch (chain.toLowerCase()) {
    case 'input': return '#007bff';
    case 'forward': return '#28a745';
    case 'output': return '#17a2b8';
    case 'srcnat': return '#fd7e14';
    case 'dstnat': return '#6f42c1';
    default: return '#6c757d';
  }
};