import { makeRouterOSRequest } from './api';

import type { ApiResponse } from '@shared/routeros';

/**
 * Enhanced DHCP Server Management Service
 * Provides comprehensive DHCP server configuration, lease management, and advanced features
 */

/** DHCP Option interface for custom options */
export interface DHCPOption {
  readonly id: string;
  readonly code: number;
  readonly name?: string;
  readonly value: string;
  readonly comment?: string;
}

/** Enhanced DHCP Server interface with all RouterOS options */
export interface EnhancedDHCPServer {
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
  readonly relayAgent?: boolean;
  readonly useRadius?: boolean;
  readonly radiusServer?: string;
  readonly srcAddress?: string;
  readonly delayThreshold?: string;
  readonly leaseScript?: string;
  readonly alertScript?: string;
  readonly options?: DHCPOption[];
}

/** Static DHCP Reservation interface */
export interface DHCPReservation {
  readonly id: string;
  readonly address: string;
  readonly macAddress: string;
  readonly clientId?: string;
  readonly hostname?: string;
  readonly server: string;
  readonly comment?: string;
  readonly disabled?: boolean;
  readonly leaseTime?: string;
  readonly dhcpOptions?: DHCPOption[];
}

/** Enhanced DHCP Lease with more details */
export interface EnhancedDHCPLease {
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
  readonly bindingTime?: string;
  readonly dhcpOption?: string;
  readonly radius?: boolean;
  readonly routingMark?: string;
  readonly rate?: string;
  readonly srcAddress?: string;
  readonly activeMacAddress?: string;
  readonly activeAddress?: string;
  readonly activeServer?: string;
  readonly agent?: {
    circuitId?: string;
    remoteId?: string;
  };
}

/** Enhanced DHCP Pool with more configuration options */
export interface EnhancedDHCPPool {
  readonly id: string;
  readonly name: string;
  readonly ranges: string;
  readonly nextPool?: string;
  readonly comment?: string;
  readonly usedBy?: string[];
  readonly totalIPs?: number;
  readonly usedIPs?: number;
  readonly utilizationPercent?: number;
}

/** Enhanced DHCP Network with all options */
export interface EnhancedDHCPNetwork {
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
  readonly bootFileName?: string;
  readonly nextServer?: string;
  readonly dhcpOptions?: DHCPOption[];
  readonly capsMantHost?: string;
  readonly capsMantPort?: number;
}

/** DHCP Client Configuration interface */
export interface DHCPClient {
  readonly id: string;
  readonly interface: string;
  readonly disabled?: boolean;
  readonly addDefaultRoute?: 'yes' | 'no' | 'special-classless';
  readonly defaultRouteDistance?: number;
  readonly useRadius?: boolean;
  readonly clientId?: string;
  readonly hostname?: string;
  readonly script?: string;
  readonly comment?: string;
  readonly dhcpOptions?: string;
  readonly vendorClassId?: string;
  readonly status?: 'bound' | 'requesting' | 'renewing' | 'rebinding' | 'stopped' | 'error' | 'searching';
  readonly address?: string;
  readonly gateway?: string;
  readonly primaryDns?: string;
  readonly secondaryDns?: string;
  readonly dhcpServer?: string;
  readonly expiresAfter?: string;
  readonly invalidBefore?: string;
}

/** DHCP Pool Utilization interface */
export interface DHCPPoolUtilization {
  readonly poolId: string;
  readonly poolName: string;
  readonly totalIPs: number;
  readonly usedIPs: number;
  readonly availableIPs: number;
  readonly utilizationPercent: number;
  readonly ranges: string[];
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
  readonly status: 'normal' | 'warning' | 'critical';
}

/** DHCP Alert Configuration */
export interface DHCPAlert {
  readonly id: string;
  readonly type: 'pool-exhaustion' | 'lease-conflict' | 'server-down' | 'high-utilization';
  readonly enabled: boolean;
  readonly threshold?: number;
  readonly poolId?: string;
  readonly serverId?: string;
  readonly emailNotification?: boolean;
  readonly webhookUrl?: string;
  readonly comment?: string;
}

/** DHCP Server Statistics interface */
export interface DHCPServerStats {
  readonly serverId: string;
  readonly serverName: string;
  readonly totalLeases: number;
  readonly boundLeases: number;
  readonly offeredLeases: number;
  readonly waitingLeases: number;
  readonly expiredLeases: number;
  readonly staticLeases: number;
  readonly poolUtilization: DHCPPoolUtilization[];
  readonly averageLeaseTime: string;
  readonly peakUsage: number;
  readonly requestsPerMinute: number;
  readonly conflicts: number;
  readonly uptime: string;
}

/**
 * Get enhanced DHCP servers with full configuration
 */
export const getEnhancedDHCPServers = async (routerIp: string): Promise<ApiResponse<EnhancedDHCPServer[]>> => {
  return makeRouterOSRequest<EnhancedDHCPServer[]>(routerIp, 'ip/dhcp-server');
};

/**
 * Get DHCP server options
 */
export const getDHCPServerOptions = async (routerIp: string): Promise<ApiResponse<DHCPOption[]>> => {
  return makeRouterOSRequest<DHCPOption[]>(routerIp, 'ip/dhcp-server/option');
};

/**
 * Add DHCP server option
 */
export const addDHCPServerOption = async (
  routerIp: string,
  option: Partial<DHCPOption>
): Promise<ApiResponse<DHCPOption>> => {
  return makeRouterOSRequest<DHCPOption>(routerIp, 'ip/dhcp-server/option', {
    method: 'POST',
    body: option,
  });
};

/**
 * Update DHCP server option
 */
export const updateDHCPServerOption = async (
  routerIp: string,
  optionId: string,
  updates: Partial<DHCPOption>
): Promise<ApiResponse<DHCPOption>> => {
  return makeRouterOSRequest<DHCPOption>(routerIp, `ip/dhcp-server/option/${optionId}`, {
    method: 'PATCH',
    body: updates,
  });
};

/**
 * Delete DHCP server option
 */
export const deleteDHCPServerOption = async (
  routerIp: string,
  optionId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/option/${optionId}`, {
    method: 'DELETE',
  });
};

/**
 * Get static DHCP reservations
 */
export const getDHCPReservations = async (routerIp: string): Promise<ApiResponse<DHCPReservation[]>> => {
  const result = await makeRouterOSRequest<EnhancedDHCPLease[]>(routerIp, 'ip/dhcp-server/lease');
  
  if (!result.success || !result.data) {
    return result as ApiResponse<DHCPReservation[]>;
  }

  // Filter for static leases only
  const staticLeases = result.data.filter(lease => !lease.dynamic);
  
  const reservations: DHCPReservation[] = staticLeases.map(lease => ({
    id: lease.id,
    address: lease.address,
    macAddress: lease.macAddress,
    clientId: lease.clientId,
    hostname: lease.hostname,
    server: lease.server,
    comment: lease.comment,
    disabled: lease.disabled,
    leaseTime: lease.expiresAfter,
  }));

  return {
    success: true,
    data: reservations,
    timestamp: Date.now(),
  };
};

/**
 * Add static DHCP reservation
 */
export const addDHCPReservation = async (
  routerIp: string,
  reservation: Partial<DHCPReservation>
): Promise<ApiResponse<DHCPReservation>> => {
  const routerOSLease: any = {
    'address': reservation.address,
    'mac-address': reservation.macAddress,
    'client-id': reservation.clientId,
    'hostname': reservation.hostname,
    'server': reservation.server,
    'comment': reservation.comment,
    'disabled': reservation.disabled,
    'lease-time': reservation.leaseTime,
  };

  return makeRouterOSRequest<DHCPReservation>(routerIp, 'ip/dhcp-server/lease', {
    method: 'POST',
    body: routerOSLease,
  });
};

/**
 * Update DHCP reservation
 */
export const updateDHCPReservation = async (
  routerIp: string,
  reservationId: string,
  updates: Partial<DHCPReservation>
): Promise<ApiResponse<DHCPReservation>> => {
  const routerOSUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSUpdates[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPReservation>(routerIp, `ip/dhcp-server/lease/${reservationId}`, {
    method: 'PATCH',
    body: routerOSUpdates,
  });
};

/**
 * Delete DHCP reservation
 */
export const deleteDHCPReservation = async (
  routerIp: string,
  reservationId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-server/lease/${reservationId}`, {
    method: 'DELETE',
  });
};

/**
 * Get enhanced DHCP leases with all details
 */
export const getEnhancedDHCPLeases = async (routerIp: string): Promise<ApiResponse<EnhancedDHCPLease[]>> => {
  return makeRouterOSRequest<EnhancedDHCPLease[]>(routerIp, 'ip/dhcp-server/lease');
};

/**
 * Get enhanced DHCP pools with utilization data
 */
export const getEnhancedDHCPPools = async (routerIp: string): Promise<ApiResponse<EnhancedDHCPPool[]>> => {
  try {
    const [poolsResult, leasesResult] = await Promise.all([
      makeRouterOSRequest<EnhancedDHCPPool[]>(routerIp, 'ip/pool'),
      getEnhancedDHCPLeases(routerIp)
    ]);

    if (!poolsResult.success) {
      return poolsResult;
    }

    const pools = poolsResult.data || [];
    const leases = leasesResult.success ? leasesResult.data || [] : [];

    // Calculate utilization for each pool
    const enhancedPools: EnhancedDHCPPool[] = pools.map(pool => {
      const poolLeases = leases.filter(lease => 
        lease.status === 'bound' && isIPInRange(lease.address, pool.ranges)
      );

      const totalIPs = calculateTotalIPs(pool.ranges);
      const usedIPs = poolLeases.length;
      const utilizationPercent = totalIPs > 0 ? Math.round((usedIPs / totalIPs) * 100) : 0;

      return {
        ...pool,
        totalIPs,
        usedIPs,
        utilizationPercent,
      };
    });

    return {
      success: true,
      data: enhancedPools,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get enhanced DHCP pools',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get enhanced DHCP networks with all options
 */
export const getEnhancedDHCPNetworks = async (routerIp: string): Promise<ApiResponse<EnhancedDHCPNetwork[]>> => {
  return makeRouterOSRequest<EnhancedDHCPNetwork[]>(routerIp, 'ip/dhcp-server/network');
};

/**
 * Get DHCP clients configuration
 */
export const getDHCPClients = async (routerIp: string): Promise<ApiResponse<DHCPClient[]>> => {
  return makeRouterOSRequest<DHCPClient[]>(routerIp, 'ip/dhcp-client');
};

/**
 * Add DHCP client configuration
 */
export const addDHCPClient = async (
  routerIp: string,
  client: Partial<DHCPClient>
): Promise<ApiResponse<DHCPClient>> => {
  const routerOSClient: any = {};
  for (const [key, value] of Object.entries(client)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSClient[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPClient>(routerIp, 'ip/dhcp-client', {
    method: 'POST',
    body: routerOSClient,
  });
};

/**
 * Update DHCP client configuration
 */
export const updateDHCPClient = async (
  routerIp: string,
  clientId: string,
  updates: Partial<DHCPClient>
): Promise<ApiResponse<DHCPClient>> => {
  const routerOSUpdates: any = {};
  for (const [key, value] of Object.entries(updates)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSUpdates[kebabKey] = value;
  }

  return makeRouterOSRequest<DHCPClient>(routerIp, `ip/dhcp-client/${clientId}`, {
    method: 'PATCH',
    body: routerOSUpdates,
  });
};

/**
 * Delete DHCP client configuration
 */
export const deleteDHCPClient = async (
  routerIp: string,
  clientId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-client/${clientId}`, {
    method: 'DELETE',
  });
};

/**
 * Renew DHCP client lease
 */
export const renewDHCPClient = async (
  routerIp: string,
  clientId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-client/${clientId}/renew`, {
    method: 'POST',
  });
};

/**
 * Release DHCP client lease
 */
export const releaseDHCPClient = async (
  routerIp: string,
  clientId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/dhcp-client/${clientId}/release`, {
    method: 'POST',
  });
};

/**
 * Get DHCP pool utilization data
 */
export const getDHCPPoolUtilization = async (routerIp: string): Promise<ApiResponse<DHCPPoolUtilization[]>> => {
  try {
    const [poolsResult, leasesResult] = await Promise.all([
      getEnhancedDHCPPools(routerIp),
      getEnhancedDHCPLeases(routerIp)
    ]);

    if (!poolsResult.success || !leasesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch pool or lease data',
        timestamp: Date.now(),
      };
    }

    const pools = poolsResult.data || [];
    const leases = leasesResult.data || [];

    const utilization: DHCPPoolUtilization[] = pools.map(pool => {
      const totalIPs = pool.totalIPs || 0;
      const usedIPs = pool.usedIPs || 0;
      const availableIPs = totalIPs - usedIPs;
      const utilizationPercent = pool.utilizationPercent || 0;

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (utilizationPercent >= 90) {
        status = 'critical';
      } else if (utilizationPercent >= 75) {
        status = 'warning';
      }

      return {
        poolId: pool.id,
        poolName: pool.name,
        totalIPs,
        usedIPs,
        availableIPs,
        utilizationPercent,
        ranges: pool.ranges.split(',').map(r => r.trim()),
        warningThreshold: 75,
        criticalThreshold: 90,
        status,
      };
    });

    return {
      success: true,
      data: utilization,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate pool utilization',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get comprehensive DHCP server statistics
 */
export const getDHCPServerStatistics = async (routerIp: string): Promise<ApiResponse<DHCPServerStats[]>> => {
  try {
    const [serversResult, leasesResult, poolsResult] = await Promise.all([
      getEnhancedDHCPServers(routerIp),
      getEnhancedDHCPLeases(routerIp),
      getDHCPPoolUtilization(routerIp)
    ]);

    if (!serversResult.success || !leasesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch DHCP data',
        timestamp: Date.now(),
      };
    }

    const servers = serversResult.data || [];
    const leases = leasesResult.data || [];
    const pools = poolsResult.success ? poolsResult.data || [] : [];

    const stats: DHCPServerStats[] = servers.map(server => {
      const serverLeases = leases.filter(lease => lease.server === server.name);
      const serverPools = pools.filter(pool => pool.poolName === server.addressPool);

      return {
        serverId: server.id,
        serverName: server.name,
        totalLeases: serverLeases.length,
        boundLeases: serverLeases.filter(l => l.status === 'bound').length,
        offeredLeases: serverLeases.filter(l => l.status === 'offered').length,
        waitingLeases: serverLeases.filter(l => l.status === 'waiting').length,
        expiredLeases: serverLeases.filter(l => l.status === 'expired').length,
        staticLeases: serverLeases.filter(l => !l.dynamic).length,
        poolUtilization: serverPools,
        averageLeaseTime: server.leaseTime || '1d',
        peakUsage: Math.max(...serverPools.map(p => p.utilizationPercent), 0),
        requestsPerMinute: 0, // Would need monitoring data
        conflicts: 0, // Would need conflict detection
        uptime: '0s', // Would need system uptime
      };
    });

    return {
      success: true,
      data: stats,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate DHCP server statistics',
      timestamp: Date.now(),
    };
  }
};

/**
 * Export DHCP configuration as JSON
 */
export const exportDHCPConfiguration = async (routerIp: string): Promise<ApiResponse<any>> => {
  try {
    const [servers, leases, pools, networks, options, clients] = await Promise.all([
      getEnhancedDHCPServers(routerIp),
      getEnhancedDHCPLeases(routerIp),
      getEnhancedDHCPPools(routerIp),
      getEnhancedDHCPNetworks(routerIp),
      getDHCPServerOptions(routerIp),
      getDHCPClients(routerIp)
    ]);

    const configuration = {
      exportedAt: new Date().toISOString(),
      routerIP: routerIp,
      servers: servers.success ? servers.data : [],
      leases: leases.success ? leases.data : [],
      pools: pools.success ? pools.data : [],
      networks: networks.success ? networks.data : [],
      options: options.success ? options.data : [],
      clients: clients.success ? clients.data : [],
    };

    return {
      success: true,
      data: configuration,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export DHCP configuration',
      timestamp: Date.now(),
    };
  }
};

/**
 * Import DHCP reservations from CSV
 */
export const importDHCPReservations = async (
  routerIp: string,
  csvData: string,
  serverId: string
): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
  try {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const errors: string[] = [];
    const imported: DHCPReservation[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push(`Line ${i + 1}: Column count mismatch`);
        continue;
      }

      const reservation: Record<string, string> = {
        server: serverId,
      };

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'address':
          case 'ip':
            reservation.address = value;
            break;
          case 'mac':
          case 'macaddress':
          case 'mac-address':
            reservation.macAddress = value;
            break;
          case 'hostname':
          case 'name':
            reservation.hostname = value;
            break;
          case 'comment':
            reservation.comment = value;
            break;
        }
      });

      if (!reservation.address || !reservation.macAddress) {
        errors.push(`Line ${i + 1}: Missing required fields (address, macAddress)`);
        continue;
      }

      try {
        const result = await addDHCPReservation(routerIp, reservation);
        if (result.success) {
          imported.push(result.data!);
        } else {
          errors.push(`Line ${i + 1}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      data: { imported: imported.length, errors },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import reservations',
      timestamp: Date.now(),
    };
  }
};

/**
 * Helper function to check if IP is in range
 */
function isIPInRange(ip: string, ranges: string): boolean {
  const rangeList = ranges.split(',').map(r => r.trim());
  
  for (const range of rangeList) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(r => r.trim());
      if (isIPBetween(ip, start, end)) {
        return true;
      }
    } else if (range.includes('/')) {
      if (isIPInCIDR(ip, range)) {
        return true;
      }
    } else if (ip === range) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper function to check if IP is between two IPs
 */
function isIPBetween(ip: string, start: string, end: string): boolean {
  const ipNum = ipToNumber(ip);
  const startNum = ipToNumber(start);
  const endNum = ipToNumber(end);
  
  return ipNum >= startNum && ipNum <= endNum;
}

/**
 * Helper function to check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);
  
  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Helper function to convert IP address to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Helper function to calculate total IPs in ranges
 */
function calculateTotalIPs(ranges: string): number {
  const rangeList = ranges.split(',').map(r => r.trim());
  let total = 0;
  
  for (const range of rangeList) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(r => r.trim());
      total += ipToNumber(end) - ipToNumber(start) + 1;
    } else if (range.includes('/')) {
      const [, prefixStr] = range.split('/');
      const prefix = parseInt(prefixStr, 10);
      total += Math.pow(2, 32 - prefix) - 2; // Subtract network and broadcast
    } else {
      total += 1;
    }
  }
  
  return total;
}

/**
 * Get lease status color for enhanced styling
 */
export const getEnhancedLeaseStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'bound': return '#28a745';
    case 'waiting': return '#ffc107';
    case 'offered': return '#17a2b8';
    case 'expired': return '#dc3545';
    case 'requesting': return '#6f42c1';
    case 'renewing': return '#fd7e14';
    case 'rebinding': return '#e83e8c';
    default: return '#6c757d';
  }
};

/**
 * Format DHCP option value for display
 */
export const formatDHCPOptionValue = (code: number, value: string): string => {
  switch (code) {
    case 1: return `Subnet Mask: ${value}`;
    case 3: return `Router: ${value}`;
    case 6: return `DNS Server: ${value}`;
    case 15: return `Domain Name: ${value}`;
    case 42: return `NTP Server: ${value}`;
    case 66: return `TFTP Server: ${value}`;
    case 67: return `Boot File: ${value}`;
    case 150: return `Cisco TFTP: ${value}`;
    default: return `Option ${code}: ${value}`;
  }
};

/**
 * Validate DHCP option value
 */
export const validateDHCPOption = (code: number, value: string): boolean => {
  switch (code) {
    case 1: // Subnet mask
    case 3: // Router
    case 6: // DNS server
    case 42: // NTP server
    case 150: // Cisco TFTP server
      return isValidIPAddress(value);
    case 15: // Domain name
    case 66: // TFTP server name
    case 67: // Boot file name
      return value.length > 0 && value.length <= 255;
    default:
      return true; // Allow any value for unknown options
  }
};

/**
 * Validate IP address format (imported from existing dhcp.ts)
 */
function isValidIPAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}