import type { ApiResponse } from '@shared/routeros';
import { makeRouterOSRequest } from './api';

/**
 * Network Monitoring Service
 * Provides access to network interfaces, routing, ARP, and monitoring data
 */

/** Network Interface interface */
export interface NetworkInterface {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly running?: boolean;
  readonly disabled?: boolean;
  readonly macAddress?: string;
  readonly mtu?: number;
  readonly actualMtu?: number;
  readonly l2Mtu?: number;
  readonly maxL2Mtu?: number;
  readonly fastPath?: boolean;
  readonly link?: boolean;
  readonly comment?: string;
  readonly rxByte?: number;
  readonly txByte?: number;
  readonly rxPacket?: number;
  readonly txPacket?: number;
  readonly rxDrop?: number;
  readonly txDrop?: number;
  readonly rxError?: number;
  readonly txError?: number;
}

/** IP Address interface */
export interface IPAddress {
  readonly id: string;
  readonly address: string;
  readonly network?: string;
  readonly interface: string;
  readonly actualInterface?: string;
  readonly invalid?: boolean;
  readonly dynamic?: boolean;
  readonly disabled?: boolean;
  readonly comment?: string;
}

/** Route interface */
export interface Route {
  readonly id: string;
  readonly dstAddress: string;
  readonly gateway?: string;
  readonly gatewayStatus?: string;
  readonly distance?: number;
  readonly scope?: number;
  readonly targetScope?: number;
  readonly interface?: string;
  readonly active?: boolean;
  readonly dynamic?: boolean;
  readonly static?: boolean;
  readonly connect?: boolean;
  readonly blackhole?: boolean;
  readonly unreachable?: boolean;
  readonly suppress?: boolean;
  readonly comment?: string;
}

/** ARP Entry interface */
export interface ARPEntry {
  readonly address: string;
  readonly macAddress: string;
  readonly interface: string;
  readonly invalid?: boolean;
  readonly complete?: boolean;
  readonly disabled?: boolean;
  readonly dynamic?: boolean;
  readonly published?: boolean;
  readonly comment?: string;
}

/** Network Statistics interface */
export interface NetworkStats {
  readonly totalInterfaces: number;
  readonly activeInterfaces: number;
  readonly totalRoutes: number;
  readonly activeRoutes: number;
  readonly totalARPEntries: number;
  readonly totalIPAddresses: number;
  readonly totalTrafficRx: number;
  readonly totalTrafficTx: number;
}

/** Interface Traffic Rate interface */
export interface InterfaceTrafficRate {
  readonly name: string;
  readonly rxRate: number;
  readonly txRate: number;
  readonly rxPacketRate: number;
  readonly txPacketRate: number;
}

/**
 * Get network interfaces
 * REST API endpoint: /rest/interface
 */
export const getNetworkInterfaces = async (routerIp: string): Promise<ApiResponse<NetworkInterface[]>> => {
  return makeRouterOSRequest<NetworkInterface[]>(routerIp, 'interface');
};

/**
 * Get IP addresses
 * REST API endpoint: /rest/ip/address
 */
export const getIPAddresses = async (routerIp: string): Promise<ApiResponse<IPAddress[]>> => {
  return makeRouterOSRequest<IPAddress[]>(routerIp, 'ip/address');
};

/**
 * Get routing table
 * REST API endpoint: /rest/ip/route
 */
export const getRoutes = async (routerIp: string): Promise<ApiResponse<Route[]>> => {
  return makeRouterOSRequest<Route[]>(routerIp, 'ip/route');
};

/**
 * Get ARP table
 * REST API endpoint: /rest/ip/arp
 */
export const getARPTable = async (routerIp: string): Promise<ApiResponse<ARPEntry[]>> => {
  return makeRouterOSRequest<ARPEntry[]>(routerIp, 'ip/arp');
};

/**
 * Get interface statistics
 * REST API endpoint: /rest/interface/print?stats
 */
export const getInterfaceStats = async (routerIp: string): Promise<ApiResponse<NetworkInterface[]>> => {
  return makeRouterOSRequest<NetworkInterface[]>(routerIp, 'interface', {
    method: 'GET',
    params: { stats: 'yes' }
  } as any);
};

/**
 * Toggle network interface enabled/disabled state
 * REST API endpoint: /rest/interface/{id}
 */
export const toggleNetworkInterface = async (
  routerIp: string,
  interfaceId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `interface/${interfaceId}`, {
    method: 'PATCH',
    body: { disabled: !enabled },
  });
};

/**
 * Add static route
 * REST API endpoint: /rest/ip/route
 */
export const addStaticRoute = async (
  routerIp: string,
  route: Partial<Route>
): Promise<ApiResponse<Route>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSRoute: any = {};
  for (const [key, value] of Object.entries(route)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSRoute[kebabKey] = value;
  }

  return makeRouterOSRequest<Route>(routerIp, 'ip/route', {
    method: 'POST',
    body: routerOSRoute,
  });
};

/**
 * Delete route
 * REST API endpoint: /rest/ip/route/{id}
 */
export const deleteRoute = async (
  routerIp: string,
  routeId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/route/${routeId}`, {
    method: 'DELETE',
  });
};

/**
 * Add static ARP entry
 * REST API endpoint: /rest/ip/arp
 */
export const addStaticARPEntry = async (
  routerIp: string,
  arp: Partial<ARPEntry>
): Promise<ApiResponse<ARPEntry>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSARP: any = {};
  for (const [key, value] of Object.entries(arp)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSARP[kebabKey] = value;
  }

  return makeRouterOSRequest<ARPEntry>(routerIp, 'ip/arp', {
    method: 'POST',
    body: routerOSARP,
  });
};

/**
 * Delete ARP entry
 * REST API endpoint: /rest/ip/arp/{address}
 */
export const deleteARPEntry = async (
  routerIp: string,
  address: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, `ip/arp/${address}`, {
    method: 'DELETE',
  });
};

/**
 * Get comprehensive network statistics
 */
export const getNetworkStatistics = async (routerIp: string): Promise<ApiResponse<NetworkStats>> => {
  try {
    const [interfacesResult, routesResult, arpResult, ipResult] = await Promise.all([
      getNetworkInterfaces(routerIp),
      getRoutes(routerIp),
      getARPTable(routerIp),
      getIPAddresses(routerIp)
    ]);

    if (!interfacesResult.success || !routesResult.success || !arpResult.success || !ipResult.success) {
      return {
        success: false,
        error: 'Failed to fetch network data for statistics',
        timestamp: Date.now(),
      };
    }

    const interfaces = interfacesResult.data || [];
    const routes = routesResult.data || [];
    const arpEntries = arpResult.data || [];
    const ipAddresses = ipResult.data || [];

    // Calculate total traffic
    const totalTrafficRx = interfaces.reduce((sum, iface) => sum + (iface.rxByte || 0), 0);
    const totalTrafficTx = interfaces.reduce((sum, iface) => sum + (iface.txByte || 0), 0);

    const stats: NetworkStats = {
      totalInterfaces: interfaces.length,
      activeInterfaces: interfaces.filter(i => !i.disabled && i.running).length,
      totalRoutes: routes.length,
      activeRoutes: routes.filter(r => r.active).length,
      totalARPEntries: arpEntries.length,
      totalIPAddresses: ipAddresses.length,
      totalTrafficRx,
      totalTrafficTx,
    };

    return {
      success: true,
      data: stats,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate network statistics',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get interface status color for styling
 */
export const getInterfaceStatusColor = (iface: NetworkInterface): string => {
  if (iface.disabled) return '#6c757d'; // Disabled - gray
  if (!iface.running) return '#dc3545'; // Not running - red
  if (iface.link === false) return '#ffc107'; // No link - yellow
  return '#28a745'; // Running - green
};

/**
 * Get interface status text
 */
export const getInterfaceStatusText = (iface: NetworkInterface): string => {
  if (iface.disabled) return 'Disabled';
  if (!iface.running) return 'Not Running';
  if (iface.link === false) return 'No Link';
  return 'Running';
};

/**
 * Get route type display
 */
export const getRouteTypeDisplay = (route: Route): string => {
  if (route.connect) return 'Connected';
  if (route.static) return 'Static';
  if (route.dynamic) return 'Dynamic';
  if (route.blackhole) return 'Blackhole';
  if (route.unreachable) return 'Unreachable';
  return 'Unknown';
};

/**
 * Get route type color for styling
 */
export const getRouteTypeColor = (route: Route): string => {
  if (route.connect) return '#17a2b8'; // Connected - teal
  if (route.static) return '#007bff'; // Static - blue
  if (route.dynamic) return '#28a745'; // Dynamic - green
  if (route.blackhole) return '#6c757d'; // Blackhole - gray
  if (route.unreachable) return '#dc3545'; // Unreachable - red
  return '#6c757d'; // Unknown - gray
};

/**
 * Format bytes to human-readable format with rates
 */
export const formatBytesWithRate = (bytes: number, timeInterval = 1): string => {
  const rate = bytes / timeInterval;
  return formatBytes(rate) + '/s';
};

/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

/**
 * Format packets per second
 */
export const formatPacketsPerSecond = (packets: number): string => {
  if (packets === 0) return '0 pps';
  if (packets < 1000) return `${packets.toFixed(0)} pps`;
  if (packets < 1000000) return `${(packets / 1000).toFixed(1)} Kpps`;
  return `${(packets / 1000000).toFixed(1)} Mpps`;
};

/**
 * Calculate interface utilization percentage
 */
export const calculateInterfaceUtilization = (
  rxRate: number, 
  txRate: number, 
  maxBandwidth: number
): number => {
  const totalRate = rxRate + txRate;
  return Math.min((totalRate / maxBandwidth) * 100, 100);
};

/**
 * Get utilization color based on percentage
 */
export const getUtilizationColor = (percentage: number): string => {
  if (percentage >= 90) return '#dc3545'; // Critical - red
  if (percentage >= 70) return '#fd7e14'; // Warning - orange
  if (percentage >= 50) return '#ffc107'; // Caution - yellow
  return '#28a745'; // Normal - green
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
 * Validate network CIDR format
 */
export const isValidCIDR = (cidr: string): boolean => {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) return false;
  
  const [network, prefix] = cidr.split('/');
  const prefixNum = parseInt(prefix, 10);
  
  return isValidIPAddress(network) && prefixNum >= 0 && prefixNum <= 32;
};

/**
 * Parse interface name for sorting (natural sort)
 */
export const parseInterfaceName = (name: string): { prefix: string; number: number | null } => {
  const match = name.match(/^(.+?)(\d+)$/);
  if (match) {
    return {
      prefix: match[1],
      number: parseInt(match[2], 10)
    };
  }
  return {
    prefix: name,
    number: null
  };
};

/**
 * Sort interfaces naturally by name
 */
export const sortInterfacesByName = (interfaces: NetworkInterface[]): NetworkInterface[] => {
  return [...interfaces].sort((a, b) => {
    const parsedA = parseInterfaceName(a.name);
    const parsedB = parseInterfaceName(b.name);
    
    // First sort by prefix
    if (parsedA.prefix !== parsedB.prefix) {
      return parsedA.prefix.localeCompare(parsedB.prefix);
    }
    
    // Then by number
    if (parsedA.number !== null && parsedB.number !== null) {
      return parsedA.number - parsedB.number;
    }
    
    // Fallback to string comparison
    return a.name.localeCompare(b.name);
  });
};