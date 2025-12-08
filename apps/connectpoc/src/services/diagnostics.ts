import type { ApiResponse } from '@shared/routeros';
import { makeRouterOSRequest } from './api';

/**
 * Network Diagnostics Service
 * Comprehensive network diagnostic tools for connectivity testing, performance analysis, and troubleshooting
 */

/** Ping Test Configuration */
export interface PingConfig {
  readonly target: string;
  readonly count?: number;
  readonly size?: number;
  readonly interval?: number;
  readonly timeout?: number;
  readonly ttl?: number;
  readonly srcAddress?: string;
  readonly interface?: string;
  readonly dontFragment?: boolean;
  readonly routing?: boolean;
}

/** Ping Test Result */
export interface PingResult {
  readonly id: string;
  readonly target: string;
  readonly status: 'running' | 'completed' | 'failed' | 'timeout';
  readonly packets: PingPacket[];
  readonly statistics: PingStatistics;
  readonly startTime: string;
  readonly endTime?: string;
  readonly config: PingConfig;
}

/** Individual Ping Packet */
export interface PingPacket {
  readonly sequence: number;
  readonly time?: number;
  readonly ttl?: number;
  readonly size: number;
  readonly status: 'success' | 'timeout' | 'error';
  readonly error?: string;
}

/** Ping Statistics */
export interface PingStatistics {
  readonly sent: number;
  readonly received: number;
  readonly lost: number;
  readonly lossPercent: number;
  readonly minTime?: number;
  readonly maxTime?: number;
  readonly avgTime?: number;
  readonly jitter?: number;
}

/** Traceroute Configuration */
export interface TracerouteConfig {
  readonly target: string;
  readonly maxHops?: number;
  readonly timeout?: number;
  readonly srcAddress?: string;
  readonly interface?: string;
  readonly protocol?: 'icmp' | 'udp' | 'tcp';
  readonly port?: number;
  readonly packetSize?: number;
}

/** Traceroute Result */
export interface TracerouteResult {
  readonly id: string;
  readonly target: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly hops: TracerouteHop[];
  readonly startTime: string;
  readonly endTime?: string;
  readonly config: TracerouteConfig;
}

/** Individual Traceroute Hop */
export interface TracerouteHop {
  readonly hopNumber: number;
  readonly address?: string;
  readonly hostname?: string;
  readonly times: number[];
  readonly status: 'success' | 'timeout' | 'error';
  readonly asn?: string;
  readonly location?: string;
}

/** Bandwidth Test Configuration */
export interface BandwidthConfig {
  readonly target: string;
  readonly direction?: 'upload' | 'download' | 'both';
  readonly duration?: number;
  readonly connections?: number;
  readonly protocol?: 'tcp' | 'udp';
  readonly port?: number;
  readonly packetSize?: number;
  readonly localTxSpeed?: number;
  readonly remoteTxSpeed?: number;
}

/** Bandwidth Test Result */
export interface BandwidthResult {
  readonly id: string;
  readonly target: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly downloadSpeed?: number;
  readonly uploadSpeed?: number;
  readonly latency?: number;
  readonly jitter?: number;
  readonly packetLoss?: number;
  readonly startTime: string;
  readonly endTime?: string;
  readonly config: BandwidthConfig;
  readonly samples: BandwidthSample[];
}

/** Bandwidth Test Sample */
export interface BandwidthSample {
  readonly timestamp: number;
  readonly downloadSpeed: number;
  readonly uploadSpeed: number;
  readonly latency: number;
}

/** DNS Lookup Configuration */
export interface DNSLookupConfig {
  readonly hostname: string;
  readonly recordType?: 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS' | 'PTR' | 'SOA' | 'SRV';
  readonly server?: string;
  readonly timeout?: number;
  readonly recursion?: boolean;
}

/** DNS Lookup Result */
export interface DNSLookupResult {
  readonly id: string;
  readonly hostname: string;
  readonly recordType: string;
  readonly status: 'success' | 'failed' | 'timeout';
  readonly records: DNSRecord[];
  readonly responseTime: number;
  readonly server: string;
  readonly authoritative: boolean;
  readonly timestamp: string;
}

/** DNS Record */
export interface DNSRecord {
  readonly name: string;
  readonly type: string;
  readonly ttl: number;
  readonly data: string;
  readonly priority?: number;
  readonly weight?: number;
  readonly port?: number;
}

/** Port Scan Configuration */
export interface PortScanConfig {
  readonly target: string;
  readonly ports: string; // e.g., "22,80,443" or "1-1000"
  readonly protocol?: 'tcp' | 'udp' | 'both';
  readonly timeout?: number;
  readonly threads?: number;
  readonly delay?: number;
}

/** Port Scan Result */
export interface PortScanResult {
  readonly id: string;
  readonly target: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly ports: PortResult[];
  readonly startTime: string;
  readonly endTime?: string;
  readonly config: PortScanConfig;
}

/** Individual Port Result */
export interface PortResult {
  readonly port: number;
  readonly protocol: 'tcp' | 'udp';
  readonly status: 'open' | 'closed' | 'filtered' | 'timeout';
  readonly service?: string;
  readonly version?: string;
  readonly responseTime?: number;
}

/** Network Interface Statistics */
export interface InterfaceStats {
  readonly name: string;
  readonly type: string;
  readonly mtu: number;
  readonly running: boolean;
  readonly txBytes: number;
  readonly rxBytes: number;
  readonly txPackets: number;
  readonly rxPackets: number;
  readonly txErrors: number;
  readonly rxErrors: number;
  readonly txDrops: number;
  readonly rxDrops: number;
  readonly lastUpdate: string;
}

/** Connection Test Configuration */
export interface ConnectionTestConfig {
  readonly target: string;
  readonly port: number;
  readonly protocol?: 'tcp' | 'udp';
  readonly timeout?: number;
  readonly srcAddress?: string;
}

/** Connection Test Result */
export interface ConnectionTestResult {
  readonly id: string;
  readonly target: string;
  readonly port: number;
  readonly protocol: string;
  readonly status: 'success' | 'failed' | 'timeout';
  readonly connected: boolean;
  readonly responseTime?: number;
  readonly error?: string;
  readonly timestamp: string;
}

/** Network Quality Test Result */
export interface NetworkQualityResult {
  readonly target: string;
  readonly latency: number;
  readonly jitter: number;
  readonly packetLoss: number;
  readonly downloadSpeed: number;
  readonly uploadSpeed: number;
  readonly mtu: number;
  readonly grade: 'excellent' | 'good' | 'fair' | 'poor';
  readonly recommendations: string[];
  readonly timestamp: string;
}

/**
 * Start ping test
 */
export const startPingTest = async (
  routerIp: string,
  config: PingConfig
): Promise<ApiResponse<PingResult>> => {
  const routerOSConfig: any = {
    'address': config.target,
    'count': config.count || 4,
    'size': config.size || 64,
    'interval': config.interval || 1,
    'timeout': config.timeout || 1,
    'ttl': config.ttl,
    'src-address': config.srcAddress,
    'interface': config.interface,
    'dont-fragment': config.dontFragment,
    'routing': config.routing,
  };

  // Remove undefined values
  Object.keys(routerOSConfig).forEach(key => {
    if (routerOSConfig[key] === undefined) {
      delete routerOSConfig[key];
    }
  });

  return makeRouterOSRequest<PingResult>(routerIp, 'ping', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Get ping test results
 */
export const getPingResults = async (
  routerIp: string,
  testId?: string
): Promise<ApiResponse<PingResult[]>> => {
  const endpoint = testId ? `ping/${testId}` : 'ping';
  return makeRouterOSRequest<PingResult[]>(routerIp, endpoint);
};

/**
 * Start traceroute test
 */
export const startTracerouteTest = async (
  routerIp: string,
  config: TracerouteConfig
): Promise<ApiResponse<TracerouteResult>> => {
  const routerOSConfig: any = {
    'address': config.target,
    'max-hops': config.maxHops || 30,
    'timeout': config.timeout || 1,
    'src-address': config.srcAddress,
    'interface': config.interface,
    'protocol': config.protocol || 'icmp',
    'port': config.port,
    'packet-size': config.packetSize || 40,
  };

  Object.keys(routerOSConfig).forEach(key => {
    if (routerOSConfig[key] === undefined) {
      delete routerOSConfig[key];
    }
  });

  return makeRouterOSRequest<TracerouteResult>(routerIp, 'tool/traceroute', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Get traceroute test results
 */
export const getTracerouteResults = async (
  routerIp: string,
  testId?: string
): Promise<ApiResponse<TracerouteResult[]>> => {
  const endpoint = testId ? `tool/traceroute/${testId}` : 'tool/traceroute';
  return makeRouterOSRequest<TracerouteResult[]>(routerIp, endpoint);
};

/**
 * Start bandwidth test
 */
export const startBandwidthTest = async (
  routerIp: string,
  config: BandwidthConfig
): Promise<ApiResponse<BandwidthResult>> => {
  const routerOSConfig: any = {
    'address': config.target,
    'direction': config.direction || 'both',
    'duration': config.duration || 10,
    'connections': config.connections || 1,
    'protocol': config.protocol || 'tcp',
    'port': config.port || 2000,
    'packet-size': config.packetSize,
    'local-tx-speed': config.localTxSpeed,
    'remote-tx-speed': config.remoteTxSpeed,
  };

  Object.keys(routerOSConfig).forEach(key => {
    if (routerOSConfig[key] === undefined) {
      delete routerOSConfig[key];
    }
  });

  return makeRouterOSRequest<BandwidthResult>(routerIp, 'tool/bandwidth-test', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Get bandwidth test results
 */
export const getBandwidthResults = async (
  routerIp: string,
  testId?: string
): Promise<ApiResponse<BandwidthResult[]>> => {
  const endpoint = testId ? `tool/bandwidth-test/${testId}` : 'tool/bandwidth-test';
  return makeRouterOSRequest<BandwidthResult[]>(routerIp, endpoint);
};

/**
 * Perform DNS lookup
 */
export const performDNSLookup = async (
  routerIp: string,
  config: DNSLookupConfig
): Promise<ApiResponse<DNSLookupResult>> => {
  const routerOSConfig: any = {
    'name': config.hostname,
    'type': config.recordType || 'A',
    'server': config.server,
    'timeout': config.timeout || 2,
    'do-recursion': config.recursion !== false,
  };

  Object.keys(routerOSConfig).forEach(key => {
    if (routerOSConfig[key] === undefined) {
      delete routerOSConfig[key];
    }
  });

  return makeRouterOSRequest<DNSLookupResult>(routerIp, 'tool/dns-lookup', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Start port scan
 */
export const startPortScan = async (
  routerIp: string,
  config: PortScanConfig
): Promise<ApiResponse<PortScanResult>> => {
  // Convert port range to individual ports for RouterOS
  const ports = expandPortRange(config.ports);
  
  const routerOSConfig: any = {
    'address': config.target,
    'port': ports.join(','),
    'protocol': config.protocol || 'tcp',
    'timeout': config.timeout || 1,
    'threads': config.threads || 10,
    'delay': config.delay || 0,
  };

  return makeRouterOSRequest<PortScanResult>(routerIp, 'tool/port-scan', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Get port scan results
 */
export const getPortScanResults = async (
  routerIp: string,
  testId?: string
): Promise<ApiResponse<PortScanResult[]>> => {
  const endpoint = testId ? `tool/port-scan/${testId}` : 'tool/port-scan';
  return makeRouterOSRequest<PortScanResult[]>(routerIp, endpoint);
};

/**
 * Test connection to specific host and port
 */
export const testConnection = async (
  routerIp: string,
  config: ConnectionTestConfig
): Promise<ApiResponse<ConnectionTestResult>> => {
  const routerOSConfig: any = {
    'address': config.target,
    'port': config.port,
    'protocol': config.protocol || 'tcp',
    'timeout': config.timeout || 3,
    'src-address': config.srcAddress,
  };

  Object.keys(routerOSConfig).forEach(key => {
    if (routerOSConfig[key] === undefined) {
      delete routerOSConfig[key];
    }
  });

  return makeRouterOSRequest<ConnectionTestResult>(routerIp, 'tool/tcp-connect', {
    method: 'POST',
    body: routerOSConfig,
  });
};

/**
 * Get interface statistics
 */
export const getInterfaceStatistics = async (
  routerIp: string,
  interfaceName?: string
): Promise<ApiResponse<InterfaceStats[]>> => {
  const endpoint = interfaceName ? `interface/ethernet/monitor?interface=${interfaceName}` : 'interface/ethernet/monitor';
  return makeRouterOSRequest<InterfaceStats[]>(routerIp, endpoint);
};

/**
 * Get network neighbor discovery (ARP table)
 */
export const getNetworkNeighbors = async (
  routerIp: string
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/arp');
};

/**
 * Perform comprehensive network quality test
 */
export const performNetworkQualityTest = async (
  routerIp: string,
  target: string
): Promise<ApiResponse<NetworkQualityResult>> => {
  try {
    // Run multiple tests in parallel
    const [pingResult, bandwidthResult, dnsResult] = await Promise.allSettled([
      startPingTest(routerIp, { target, count: 10 }),
      startBandwidthTest(routerIp, { target, duration: 5 }),
      performDNSLookup(routerIp, { hostname: target })
    ]);

    // Process results
    let latency = 0;
    let jitter = 0;
    let packetLoss = 0;
    let downloadSpeed = 0;
    let uploadSpeed = 0;

    if (pingResult.status === 'fulfilled' && pingResult.value.success && pingResult.value.data) {
      const stats = pingResult.value.data.statistics;
      latency = stats.avgTime || 0;
      jitter = stats.jitter || 0;
      packetLoss = stats.lossPercent;
    }

    if (bandwidthResult.status === 'fulfilled' && bandwidthResult.value.success && bandwidthResult.value.data) {
      downloadSpeed = bandwidthResult.value.data.downloadSpeed || 0;
      uploadSpeed = bandwidthResult.value.data.uploadSpeed || 0;
    }

    // Calculate network grade
    const grade = calculateNetworkGrade(latency, jitter, packetLoss, downloadSpeed);
    
    // Generate recommendations
    const recommendations = generateNetworkRecommendations(latency, jitter, packetLoss, downloadSpeed, uploadSpeed);

    const result: NetworkQualityResult = {
      target,
      latency,
      jitter,
      packetLoss,
      downloadSpeed,
      uploadSpeed,
      mtu: 1500, // Default, could be detected
      grade,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform network quality test',
      timestamp: Date.now(),
    };
  }
};

/**
 * Stop running diagnostic test
 */
export const stopDiagnosticTest = async (
  routerIp: string,
  testType: 'ping' | 'traceroute' | 'bandwidth' | 'port-scan',
  testId: string
): Promise<ApiResponse<void>> => {
  const endpointMap = {
    'ping': 'ping',
    'traceroute': 'tool/traceroute',
    'bandwidth': 'tool/bandwidth-test',
    'port-scan': 'tool/port-scan',
  };

  return makeRouterOSRequest<void>(routerIp, `${endpointMap[testType]}/${testId}`, {
    method: 'DELETE',
  });
};

/**
 * Get real-time diagnostic test status
 */
export const getDiagnosticTestStatus = async (
  routerIp: string,
  testType: 'ping' | 'traceroute' | 'bandwidth' | 'port-scan',
  testId: string
): Promise<ApiResponse<any>> => {
  const endpointMap = {
    'ping': 'ping',
    'traceroute': 'tool/traceroute',
    'bandwidth': 'tool/bandwidth-test',
    'port-scan': 'tool/port-scan',
  };

  return makeRouterOSRequest<any>(routerIp, `${endpointMap[testType]}/${testId}/status`);
};

/**
 * Export diagnostic results
 */
export const exportDiagnosticResults = async (
  routerIp: string,
  testIds: string[],
  format: 'json' | 'csv' | 'txt' = 'json'
): Promise<ApiResponse<any>> => {
  try {
    const results: any = {
      exportedAt: new Date().toISOString(),
      routerIP: routerIp,
      format,
      tests: {},
    };

    // Fetch all test results
    for (const testId of testIds) {
      // Try to get results from all test types
      const testTypes = ['ping', 'traceroute', 'bandwidth', 'port-scan'] as const;
      
      for (const testType of testTypes) {
        try {
          const result = await getDiagnosticTestStatus(routerIp, testType, testId);
          if (result.success && result.data) {
            if (!results.tests[testType]) {
              results.tests[testType] = [];
            }
            results.tests[testType].push(result.data);
          }
        } catch {
          // Ignore errors for tests that don't exist
        }
      }
    }

    return {
      success: true,
      data: results,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export diagnostic results',
      timestamp: Date.now(),
    };
  }
};

/**
 * Helper function to expand port ranges
 */
function expandPortRange(portString: string): number[] {
  const ports: number[] = [];
  const parts = portString.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(p => parseInt(p.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= 65535) {
            ports.push(i);
          }
        }
      }
    } else {
      const port = parseInt(trimmed, 10);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        ports.push(port);
      }
    }
  }

  return Array.from(new Set(ports)).sort((a, b) => a - b);
}

/**
 * Calculate network grade based on metrics
 */
function calculateNetworkGrade(
  latency: number,
  jitter: number,
  packetLoss: number,
  speed: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 100;

  // Latency scoring (0-30 points)
  if (latency > 100) score -= 30;
  else if (latency > 50) score -= 20;
  else if (latency > 20) score -= 10;
  else if (latency > 10) score -= 5;

  // Jitter scoring (0-25 points)
  if (jitter > 20) score -= 25;
  else if (jitter > 10) score -= 15;
  else if (jitter > 5) score -= 10;
  else if (jitter > 2) score -= 5;

  // Packet loss scoring (0-35 points)
  if (packetLoss > 5) score -= 35;
  else if (packetLoss > 2) score -= 25;
  else if (packetLoss > 1) score -= 15;
  else if (packetLoss > 0.5) score -= 10;
  else if (packetLoss > 0.1) score -= 5;

  // Speed scoring (0-10 points)
  if (speed < 1) score -= 10;
  else if (speed < 10) score -= 5;

  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Generate network recommendations
 */
function generateNetworkRecommendations(
  latency: number,
  jitter: number,
  packetLoss: number,
  downloadSpeed: number,
  uploadSpeed: number
): string[] {
  const recommendations: string[] = [];

  if (latency > 100) {
    recommendations.push('High latency detected. Check network path and consider routing optimization.');
  } else if (latency > 50) {
    recommendations.push('Moderate latency. Monitor network performance during peak hours.');
  }

  if (jitter > 10) {
    recommendations.push('High jitter detected. Check for network congestion and QoS configuration.');
  }

  if (packetLoss > 1) {
    recommendations.push('Packet loss detected. Check cable connections and interface errors.');
  }

  if (downloadSpeed < uploadSpeed * 2) {
    recommendations.push('Asymmetric bandwidth. Verify bandwidth allocation and QoS policies.');
  }

  if (downloadSpeed < 10) {
    recommendations.push('Low bandwidth detected. Consider upgrading connection or optimizing traffic.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Network performance looks good. No immediate issues detected.');
  }

  return recommendations;
}

/**
 * Format diagnostic result for display
 */
export const formatDiagnosticResult = (result: any, type: string): string => {
  switch (type) {
    case 'ping': {
      const pingResult = result as PingResult;
      return `Ping to ${pingResult.target}: ${pingResult.statistics.received}/${pingResult.statistics.sent} packets, ${pingResult.statistics.avgTime?.toFixed(2)}ms avg`;
    }
    
    case 'traceroute': {
      const traceResult = result as TracerouteResult;
      return `Traceroute to ${traceResult.target}: ${traceResult.hops.length} hops`;
    }
    
    case 'bandwidth': {
      const bwResult = result as BandwidthResult;
      return `Bandwidth to ${bwResult.target}: ↓${formatSpeed(bwResult.downloadSpeed)} ↑${formatSpeed(bwResult.uploadSpeed)}`;
    }
    
    case 'dns': {
      const dnsResult = result as DNSLookupResult;
      return `DNS lookup for ${dnsResult.hostname}: ${dnsResult.records.length} records in ${dnsResult.responseTime}ms`;
    }
    
    case 'port': {
      const portResult = result as PortScanResult;
      const openPorts = portResult.ports.filter(p => p.status === 'open').length;
      return `Port scan of ${portResult.target}: ${openPorts} open ports found`;
    }
    
    default:
      return 'Diagnostic test completed';
  }
};

/**
 * Format speed in human readable format
 */
export const formatSpeed = (speedMbps?: number): string => {
  if (!speedMbps || speedMbps === 0) return '0 Mbps';
  
  if (speedMbps >= 1000) {
    return `${(speedMbps / 1000).toFixed(1)} Gbps`;
  }
  
  return `${speedMbps.toFixed(1)} Mbps`;
};

/**
 * Format latency for display
 */
export const formatLatency = (latencyMs?: number): string => {
  if (!latencyMs) return '—';
  
  if (latencyMs < 1) {
    return `${(latencyMs * 1000).toFixed(0)}μs`;
  }
  
  return `${latencyMs.toFixed(1)}ms`;
};

/**
 * Get status color for diagnostic results
 */
export const getDiagnosticStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'open':
      return '#28a745';
    case 'running':
    case 'in_progress':
      return '#007bff';
    case 'timeout':
    case 'warning':
      return '#ffc107';
    case 'failed':
    case 'error':
    case 'closed':
    case 'filtered':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

/**
 * Get network quality color
 */
export const getNetworkQualityColor = (grade: string): string => {
  switch (grade.toLowerCase()) {
    case 'excellent':
      return '#28a745';
    case 'good':
      return '#20c997';
    case 'fair':
      return '#ffc107';
    case 'poor':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

/**
 * Validate IP address or hostname
 */
export const isValidTarget = (target: string): boolean => {
  // Check if it's a valid IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(target)) {
    const parts = target.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // Check if it's a valid hostname
  const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return hostnameRegex.test(target) && target.length <= 253;
};

/**
 * Validate port number
 */
export const isValidPort = (port: number | string): boolean => {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

/**
 * Validate port range string
 */
export const isValidPortRange = (portRange: string): boolean => {
  const parts = portRange.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(p => parseInt(p.trim(), 10));
      if (isNaN(start) || isNaN(end) || start <= 0 || end > 65535 || start > end) {
        return false;
      }
    } else {
      const port = parseInt(trimmed, 10);
      if (!isValidPort(port)) {
        return false;
      }
    }
  }
  
  return true;
};