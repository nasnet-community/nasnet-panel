import { makeRouterOSRequest } from './api';

import type { ApiResponse } from '@shared/routeros';

/**
 * DHCP Management Service
 * Provides access to DHCP server configuration, client lists, and lease management
 */

/** DHCP Server interface */
export interface DHCPServer {
  readonly id: string;
  readonly name: string;
  readonly interface: string;
  readonly addressPool: string;
  readonly disabled?: boolean;
  readonly leaseTime?: string;
  readonly addArp?: boolean;
  readonly authoritative?: 'yes' | 'no' | 'after-2sec-delay' | 'after-10sec-delay';
  readonly bootp?: boolean;
  readonly conflict?: 'detect' | 'ignore';
  readonly comment?: string;
}

/** DHCP Client Lease interface */
export interface DHCPLease {
  readonly id: string;
  readonly address: string;
  readonly macAddress: string;
  readonly clientId?: string;
  readonly hostname?: string;
  readonly server: string;
  readonly status: 'bound' | 'waiting' | 'offered' | 'expired';
  readonly expiresAfter: string;
  readonly lastSeen?: string;
  readonly dynamic?: boolean;
  readonly blocked?: boolean;
  readonly disabled?: boolean;
  readonly comment?: string;
}

/** DHCP Address Pool interface */
export interface DHCPPool {
  readonly id: string;
  readonly name: string;
  readonly ranges: string;
  readonly nextPool?: string;
  readonly comment?: string;
}

/** DHCP Network interface */
export interface DHCPNetwork {
  readonly id: string;
  readonly address: string;
  readonly gateway?: string;
  readonly netmask?: string;
  readonly dnsServer?: string;
  readonly domain?: string;
  readonly ntpServer?: string;
  readonly winsServer?: string;
  readonly dhcpOption?: string;
  readonly comment?: string;
}

/** DHCP Statistics interface */
export interface DHCPStats {
  readonly totalServers: number;
  readonly activeServers: number;
  readonly totalLeases: number;
  readonly activeLeases: number;
  readonly boundLeases: number;
  readonly expiredLeases: number;
}

/**
 * Get DHCP servers
 * REST API endpoint: /rest/ip/dhcp-server
 */
export const getDHCPServers = async (routerIp: string): Promise<ApiResponse<DHCPServer[]>> => {
  return makeRouterOSRequest<DHCPServer[]>(routerIp, 'ip/dhcp-server');
};

/**
 * Get DHCP client leases
 * REST API endpoint: /rest/ip/dhcp-server/lease
 */
export const getDHCPLeases = async (routerIp: string): Promise<ApiResponse<DHCPLease[]>> => {
  return makeRouterOSRequest<DHCPLease[]>(routerIp, 'ip/dhcp-server/lease');
};

/**
 * Get DHCP address pools
 * REST API endpoint: /rest/ip/pool
 */
export const getDHCPPools = async (routerIp: string): Promise<ApiResponse<DHCPPool[]>> => {
  return makeRouterOSRequest<DHCPPool[]>(routerIp, 'ip/pool');
};

/**
 * Get DHCP networks
 * REST API endpoint: /rest/ip/dhcp-server/network
 */
export const getDHCPNetworks = async (routerIp: string): Promise<ApiResponse<DHCPNetwork[]>> => {
  return makeRouterOSRequest<DHCPNetwork[]>(routerIp, 'ip/dhcp-server/network');
};

/**
 * Toggle DHCP server enabled/disabled state
 * REST API endpoint: /rest/ip/dhcp-server/{id}
 */
export const toggleDHCPServer = async (
  routerIp: string,
  serverId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/${serverId}`, {
    method: 'PATCH',
    body: { disabled: !enabled },
  });
};

/**
 * Add new DHCP server
 * REST API endpoint: /rest/ip/dhcp-server
 */
export const addDHCPServer = async (
  routerIp: string,
  server: Partial<DHCPServer>
): Promise<ApiResponse<DHCPServer>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSServer: any = {};
  for (const [key, value] of Object.entries(server)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSServer[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPServer>(routerIp, 'ip/dhcp-server', {
    method: 'POST',
    body: routerOSServer,
  });
};

/**
 * Update DHCP server
 * REST API endpoint: /rest/ip/dhcp-server/{id}
 */
export const updateDHCPServer = async (
  routerIp: string,
  serverId: string,
  updates: Partial<DHCPServer>
): Promise<ApiResponse<DHCPServer>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSUpdates[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPServer>(routerIp, `ip/dhcp-server/${serverId}`, {
    method: 'PATCH',
    body: routerOSUpdates,
  });
};

/**
 * Delete DHCP server
 * REST API endpoint: /rest/ip/dhcp-server/{id}
 */
export const deleteDHCPServer = async (
  routerIp: string,
  serverId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/${serverId}`, {
    method: 'DELETE',
  });
};

/**
 * Release DHCP lease
 * REST API endpoint: /rest/ip/dhcp-server/lease/{id}
 */
export const releaseDHCPLease = async (
  routerIp: string,
  leaseId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/lease/${leaseId}`, {
    method: 'DELETE',
  });
};

/**
 * Add static DHCP lease
 * REST API endpoint: /rest/ip/dhcp-server/lease
 */
export const addStaticDHCPLease = async (
  routerIp: string,
  lease: Partial<DHCPLease>
): Promise<ApiResponse<DHCPLease>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSLease: any = {};
  for (const [key, value] of Object.entries(lease)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSLease[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPLease>(routerIp, 'ip/dhcp-server/lease', {
    method: 'POST',
    body: routerOSLease,
  });
};

/**
 * Toggle DHCP lease blocked state
 * REST API endpoint: /rest/ip/dhcp-server/lease/{id}
 */
export const toggleDHCPLeaseBlocked = async (
  routerIp: string,
  leaseId: string,
  blocked: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/lease/${leaseId}`, {
    method: 'PATCH',
    body: { blocked },
  });
};

/**
 * Add DHCP address pool
 * REST API endpoint: /rest/ip/pool
 */
export const addDHCPPool = async (
  routerIp: string,
  pool: Partial<DHCPPool>
): Promise<ApiResponse<DHCPPool>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSPool: any = {};
  for (const [key, value] of Object.entries(pool)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSPool[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPPool>(routerIp, 'ip/pool', {
    method: 'POST',
    body: routerOSPool,
  });
};

/**
 * Delete DHCP address pool
 * REST API endpoint: /rest/ip/pool/{id}
 */
export const deleteDHCPPool = async (
  routerIp: string,
  poolId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/pool/${poolId}`, {
    method: 'DELETE',
  });
};

/**
 * Add DHCP network
 * REST API endpoint: /rest/ip/dhcp-server/network
 */
export const addDHCPNetwork = async (
  routerIp: string,
  network: Partial<DHCPNetwork>
): Promise<ApiResponse<DHCPNetwork>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSNetwork: any = {};
  for (const [key, value] of Object.entries(network)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSNetwork[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPNetwork>(routerIp, 'ip/dhcp-server/network', {
    method: 'POST',
    body: routerOSNetwork,
  });
};

/**
 * Delete DHCP network
 * REST API endpoint: /rest/ip/dhcp-server/network/{id}
 */
export const deleteDHCPNetwork = async (
  routerIp: string,
  networkId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/network/${networkId}`, {
    method: 'DELETE',
  });
};

/**
 * Get comprehensive DHCP statistics
 */
export const getDHCPStatistics = async (routerIp: string): Promise<ApiResponse<DHCPStats>> => {
  try {
    const [serversResult, leasesResult] = await Promise.all([
      getDHCPServers(routerIp),
      getDHCPLeases(routerIp)
    ]);

    if (!serversResult.success || !leasesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch DHCP data for statistics',
        timestamp: Date.now(),
      };
    }

    const servers = serversResult.data || [];
    const leases = leasesResult.data || [];

    const stats: DHCPStats = {
      totalServers: servers.length,
      activeServers: servers.filter(s => !s.disabled).length,
      totalLeases: leases.length,
      activeLeases: leases.filter(l => !l.disabled && l.status === 'bound').length,
      boundLeases: leases.filter(l => l.status === 'bound').length,
      expiredLeases: leases.filter(l => l.status === 'expired').length,
    };

    return {
      success: true,
      data: stats,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate DHCP statistics',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get lease status color for styling
 */
export const getLeaseStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'bound': return '#28a745';
    case 'waiting': return '#ffc107';
    case 'offered': return '#17a2b8';
    case 'expired': return '#dc3545';
    default: return '#6c757d';
  }
};

/**
 * Get server status display
 */
export const getServerStatusDisplay = (server: DHCPServer): string => {
  return server.disabled ? 'Disabled' : 'Active';
};

/**
 * Get server status color for styling
 */
export const getServerStatusColor = (server: DHCPServer): string => {
  return server.disabled ? '#dc3545' : '#28a745';
};

/**
 * Format lease expiration time
 */
export const formatLeaseExpiration = (expiresAfter: string): string => {
  // Parse RouterOS time format and return human readable
  if (!expiresAfter || expiresAfter === 'never') {
    return 'Never';
  }
  
  // Convert RouterOS time format (e.g., "1w2d3h4m5s") to readable format
  const units = [
    { suffix: 'w', name: 'week', multiplier: 1 },
    { suffix: 'd', name: 'day', multiplier: 1 },
    { suffix: 'h', name: 'hour', multiplier: 1 },
    { suffix: 'm', name: 'minute', multiplier: 1 },
    { suffix: 's', name: 'second', multiplier: 1 },
  ];

  const parts: string[] = [];
  
  for (const unit of units) {
    const match = expiresAfter.match(new RegExp(`(\\d+)${unit.suffix}`));
    if (match) {
      const value = parseInt(match[1]);
      if (value > 0) {
        const name = value === 1 ? unit.name : `${unit.name}s`;
        parts.push(`${value} ${name}`);
      }
    }
  }

  if (parts.length === 0) {
    return 'Unknown';
  }

  // Return the most significant parts (up to 2)
  return parts.slice(0, 2).join(', ');
};

/**
 * Validate IP address format
 */
export const isValidIPAddress = (ip: string): boolean => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * Validate MAC address format
 */
export const isValidMACAddress = (mac: string): boolean => {
  const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
  return macRegex.test(mac);
};

/**
 * Validate IP range format
 */
export const isValidIPRange = (range: string): boolean => {
  // Support formats like "192.168.1.100-192.168.1.200" or "192.168.1.0/24"
  if (range.includes('-')) {
    const [start, end] = range.split('-');
    return isValidIPAddress(start.trim()) && isValidIPAddress(end.trim());
  } else if (range.includes('/')) {
    const [network, prefix] = range.split('/');
    const prefixNum = parseInt(prefix, 10);
    return isValidIPAddress(network) && prefixNum >= 0 && prefixNum <= 32;
  }
  return isValidIPAddress(range);
};