import type { 
  ScanConfig, 
  ScanResult, 
  DetectedService,
  ScanProgress,
  RouterCredentials
} from '@shared/routeros';
import { getAuthHeaderForRouter, createAuthenticatedProxyRequest } from '@/services/auth';
import { getSubnetIps, isValidSubnet } from '@/utils/network';
import { getScanConfig, saveLastScanTime } from '@/utils/storage';
import { 
  scanEntireRange as fastScanEntireRange,
  scanSubnets as fastScanSubnets,
  type FastScanConfig,
  type FastScanProgress,
  type FastScanResult,
  getOptimizedFastScanConfig,
  estimateFastScanDuration,
  validateFastScanConfig,
  cancelFastScan,
  getFastScanProgress
} from './fast-scanner';
import {
  detectActiveSubnets,
  getFastestScanSubnets,
  clearSubnetCache,
  type DetectedSubnet,
  type SubnetDetectionResult 
} from '@/utils/subnet-detector';
import {
  startProgressiveScan,
  stopProgressiveScan,
  getProgressiveScanState,
  isProgressiveScanRunning,
  getCurrentProgressiveResults,
  type ProgressiveResult,
  type ProgressiveScanConfig,
  type ProgressiveScanState,
  type ProgressiveScanCallbacks
} from './progressive-scanner';
import {
  startPerformanceMonitoring,
  getGlobalPerformance,
  getPerformanceAlerts,
  resetPerformanceMonitoring,
  type GlobalPerformanceMetrics,
  type PerformanceAlert
} from '@/utils/performance-monitor';

/**
 * Proxy helper for making requests through the backend proxy
 */
interface ProxyRequest {
  router_ip: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
}

interface ProxyResponse {
  status: number;
  status_text?: string;
  body: any;
}

const makeProxyRequest = async (
  ip: string,
  endpoint: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  signal?: AbortSignal,
  fallbackCredentials?: RouterCredentials
): Promise<ProxyResponse> => {
  // Use authenticated proxy request helper
  try {
    const proxyRequest = createAuthenticatedProxyRequest(
      ip, 
      endpoint, 
      method, 
      undefined, 
      fallbackCredentials
    );
    
    // Merge additional headers
    Object.assign(proxyRequest.headers, headers);

    const response = await fetch(`${getBackendBaseUrl()}/api/router/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyRequest),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // If auth helper fails, fall back to basic request with provided headers
    const proxyRequest: ProxyRequest = {
      router_ip: ip,
      endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    const response = await fetch(`${getBackendBaseUrl()}/api/router/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyRequest),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
};

/**
 * Enhanced network scanning service for discovering MikroTik routers
 * Now uses Go backend for high-performance scanning with zero CORS issues
 * Supports both frontend and backend scanning modes for flexibility
 */

/** Backend scanning interfaces */
interface BackendScanRequest {
  ip_range: string;
}

interface BackendScanResponse {
  task_id: string;
  status: string;
  message: string;
}

interface BackendScanStatusResponse {
  task_id: string;
  status: string;
  progress: number;
  results: BackendDevice[];
}

interface BackendDevice {
  ip: string;
  hostname?: string;
  ports: number[];
  type: string;
  vendor: string;
  services: string[];
}

interface BackendScanStopRequest {
  task_id: string;
}

// Get backend URL from environment or use default
const getBackendBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    console.log(`🔧 Environment VITE_API_BASE_URL: ${envUrl}`);
    if (envUrl) return envUrl;
  }
  const fallbackUrl = 'http://localhost:8080';
  console.log(`🔧 Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};

/** Default ports commonly used by MikroTik RouterOS */
const MIKROTIK_PORTS = {
  WEB: 80,
  WEB_SSL: 443,
  API: 8728,
  API_SSL: 8729,
  WINBOX: 8291,
  SSH: 22,
  FTP: 21,
  TELNET: 23,
} as const;

/** Maximum concurrent scans to prevent browser overload */
const MAX_CONCURRENT_SCANS = 10;

/** Rate limiting configuration */
const RATE_LIMIT = {
  requestsPerSecond: 20,
  burstSize: 30,
};

/** Active scan state management */
interface MutableScanProgress {
  totalHosts: number;
  scannedHosts: number;
  foundHosts: number;
  currentHost: string;
  estimatedTimeRemaining: number;
  startTime: number;
  errors: string[];
}

let activeScan: {
  abortController: AbortController;
  progress: MutableScanProgress;
  startTime: number;
} | null = null;

/** Rate limiter state */
const rateLimiter = {
  tokens: RATE_LIMIT.burstSize,
  lastRefill: Date.now(),
};

/**
 * Refill rate limiter tokens
 */
const refillTokens = (): void => {
  const now = Date.now();
  const timePassed = (now - rateLimiter.lastRefill) / 1000;
  const tokensToAdd = timePassed * RATE_LIMIT.requestsPerSecond;
  
  rateLimiter.tokens = Math.min(
    RATE_LIMIT.burstSize,
    rateLimiter.tokens + tokensToAdd
  );
  rateLimiter.lastRefill = now;
};

/**
 * Wait for rate limiter token
 */
const waitForToken = async (): Promise<void> => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    refillTokens();
    
    if (rateLimiter.tokens >= 1) {
      rateLimiter.tokens -= 1;
      return;
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

/**
 * Validates if a response is actually from a MikroTik RouterOS device
 */
const validateRouterOSResponse = (responseBody: any): { isValid: boolean; version?: string; confidence: number } => {
  if (!responseBody || typeof responseBody !== 'object') {
    return { isValid: false, confidence: 0 };
  }

  let confidence = 0;

  // Check for RouterOS-specific fields (RouterOS v6 and v7+)
  const routerOSFields = [
    'version', 'version-string', 'architecture', 'architecture-name', 'board-name', 
    'cpu', 'cpu-count', 'cpu-frequency', 'total-memory', 'free-memory',
    'platform', 'factory-software', 'uptime' // RouterOS v7+ specific fields
  ];

  const presentFields = routerOSFields.filter(field => 
    Object.prototype.hasOwnProperty.call(responseBody, field) || 
    Object.prototype.hasOwnProperty.call(responseBody, field.replace('-', '_'))
  );

  confidence += presentFields.length * 10; // 10 points per RouterOS field

  // Extract version information
  const version = responseBody.version || responseBody['version-string'] || responseBody.version_string;

  // Check for RouterOS version patterns
  if (version && typeof version === 'string') {
    if (version.match(/^\d+\.\d+/)) { // Version format like "7.8" or "6.49.8"
      confidence += 20;
    }
    if (version.toLowerCase().includes('routeros')) {
      confidence += 30;
    }
  }

  // Check for architecture field (RouterOS specific - both v6 and v7+ formats)
  if (responseBody.architecture || responseBody['architecture-name'] || responseBody.arch) {
    const arch = responseBody.architecture || responseBody['architecture-name'] || responseBody.arch;
    if (typeof arch === 'string' && (arch.toLowerCase().includes('arm') || arch.toLowerCase().includes('x86') || arch.toLowerCase().includes('mips'))) {
      confidence += 15;
    }
  }

  // Check for board-name (hardware identifier)
  if (responseBody['board-name'] || responseBody.board_name) {
    confidence += 15;
  }

  // Extra confidence for RouterOS-specific values
  if (responseBody.platform && typeof responseBody.platform === 'string') {
    if (responseBody.platform.toLowerCase().includes('mikrotik')) {
      confidence += 25; // High confidence for MikroTik platform
    }
  }

  // Must have at least 3 RouterOS fields and confidence > 40 to be considered valid
  return {
    isValid: presentFields.length >= 3 && confidence >= 40,
    version,
    confidence
  };
};

/**
 * Validates RouterOS authentication response
 */
const validateRouterOSAuthResponse = (status: number, headers: Headers | any): boolean => {
  if (status !== 401) return false;
  
  // Check for RouterOS-specific authentication headers
  const wwwAuth = headers.get ? headers.get('www-authenticate') : headers['www-authenticate'];
  return wwwAuth && wwwAuth.toLowerCase().includes('basic');
};

/**
 * Detect RouterOS device by checking REST API endpoint with Basic Authentication
 * Now uses backend proxy to avoid CORS issues and validates actual RouterOS responses
 */
const detectRouterOS = async (
  ip: string,
  timeout: number,
  signal: AbortSignal,
  username: string = 'admin',
  password: string = ''
): Promise<{ isRouterOS: boolean; version?: string; needsAuth?: boolean; confidence?: number }> => {
  try {
    await waitForToken();
    
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Combine abort signals
    const combinedSignal = signal || controller.signal;
    
    // Use fallback credentials for scanning
    const fallbackCredentials: RouterCredentials = { username, password };
    
    try {
      // Try to detect RouterOS using backend proxy with proper authentication
      const proxyResponse = await makeProxyRequest(
        ip,
        '/rest/system/resource',
        'GET',
        {},
        combinedSignal,
        fallbackCredentials
      );
      
      clearTimeout(timeoutId);
      
      if (proxyResponse.status === 200) {
        try {
          const data = proxyResponse.body;
          const validation = validateRouterOSResponse(data);
          
          if (validation.isValid) {
            return {
              isRouterOS: true,
              version: validation.version,
              confidence: validation.confidence
            };
          } else {
            // Response was 200 but doesn't look like RouterOS
            return { isRouterOS: false, confidence: validation.confidence };
          }
        } catch {
          // Couldn't parse response - not RouterOS
          return { isRouterOS: false, confidence: 0 };
        }
      }
      
      // 401 indicates potential RouterOS but authentication required
      if (proxyResponse.status === 401) {
        // Validate it's actually RouterOS authentication
        const headers = (proxyResponse as any).headers || {};
        if (validateRouterOSAuthResponse(proxyResponse.status, headers)) {
          return { isRouterOS: true, needsAuth: true, confidence: 30 };
        }
        return { isRouterOS: false, confidence: 0 };
      }
      
      // Any other status means not RouterOS
      return { isRouterOS: false, confidence: 0 };
      
    } catch (error) {
      clearTimeout(timeoutId);
      return { isRouterOS: false };
    }
  } catch (error) {
    return { isRouterOS: false };
  }
};

/**
 * Scan a single host for MikroTik services
 */
const scanHost = async (
  ip: string,
  config: ScanConfig,
  signal?: AbortSignal,
  username: string = 'admin',
  password: string = ''
): Promise<ScanResult | null> => {
  const startTime = performance.now();
  const services: DetectedService[] = [];
  
  try {
    // First check if it's a RouterOS device
    const routerOSResult = await detectRouterOS(ip, config.timeout, signal!, username, password);
    
    if (!routerOSResult.isRouterOS && config.ports.length === 0) {
      return null; // Not a RouterOS device and no specific ports to check
    }
    
    // Check specific ports
    for (const port of config.ports) {
      if (signal?.aborted) break;
      
      await waitForToken();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const protocol = [443, 8729].includes(port) ? 'https' : 'http';
        const url = `${protocol}://${ip}:${port}`;
        
        // Combine abort signals
        const combinedSignal = signal ? signal : controller.signal;
        
        // For RouterOS-related ports, use the proxy for consistency
        if ([80, 443, 8728, 8729, 8291].includes(port)) {
          // Use proxy for RouterOS-related ports with proper authentication
          const fallbackCredentials: RouterCredentials = { username, password };
          await makeProxyRequest(
            ip,
            '/rest/system/identity', // Test RouterOS identity endpoint
            'GET',
            {},
            combinedSignal,
            fallbackCredentials
          );
        } else {
          // Keep direct connection for other ports (SSH, FTP, etc.)
          await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: combinedSignal,
          });
        }
        
        clearTimeout(timeoutId);
        
        // Identify service type based on port
        let serviceName = 'unknown';
        switch (port) {
          case MIKROTIK_PORTS.API:
            serviceName = 'mikrotik-api';
            break;
          case MIKROTIK_PORTS.API_SSL:
            serviceName = 'mikrotik-api-ssl';
            break;
          case MIKROTIK_PORTS.WINBOX:
            serviceName = 'winbox';
            break;
          case MIKROTIK_PORTS.WEB:
            serviceName = 'http';
            break;
          case MIKROTIK_PORTS.WEB_SSL:
            serviceName = 'https';
            break;
          case MIKROTIK_PORTS.SSH:
            serviceName = 'ssh';
            break;
          case MIKROTIK_PORTS.FTP:
            serviceName = 'ftp';
            break;
          case MIKROTIK_PORTS.TELNET:
            serviceName = 'telnet';
            break;
          default:
            serviceName = `tcp-${port}`;
        }
        
        services.push({
          port,
          protocol: 'tcp',
          service: serviceName,
        });
      } catch {
        // Port not accessible or timeout
      }
    }
    
    // Add REST API service only if RouterOS was detected with high confidence
    if (routerOSResult.isRouterOS && (routerOSResult.confidence || 0) >= 40) {
      const restService: DetectedService = {
        port: 80, // Default HTTP port
        protocol: 'tcp',
        service: 'mikrotik-rest',
      };
      
      if (routerOSResult.version) {
        restService.version = routerOSResult.version;
      }
      
      services.push(restService);
    }
    
    // Only return result if we have high confidence RouterOS or MikroTik-specific services
    const hasMikroTikPorts = services.some(s => 
      s.service === 'mikrotik-api' || s.service === 'mikrotik-api-ssl' || 
      s.service === 'winbox' || s.service === 'mikrotik-rest'
    );
    
    const hasHighConfidenceRouterOS = routerOSResult.isRouterOS && (routerOSResult.confidence || 0) >= 40;
    
    if (hasHighConfidenceRouterOS || hasMikroTikPorts) {
      const responseTime = performance.now() - startTime;
      const result: ScanResult = {
        ip,
        services,
        responseTime,
      };
      
      if (routerOSResult.version) {
        result.version = routerOSResult.version;
      }
      
      return result;
    }
  } catch (error) {
    if (!signal?.aborted) {
      console.debug(`Scan failed for ${ip}:`, error);
    }
  }
  
  return null;
};

/**
 * Backend Scanning Functions
 */

/**
 * Convert backend device to frontend ScanResult format
 */
const convertBackendDevice = (device: BackendDevice): ScanResult => {
  const services: DetectedService[] = device.ports.map((port, index) => {
    const serviceName = device.services[index] || `tcp-${port}`;
    return {
      port,
      protocol: 'tcp',
      service: serviceName,
    };
  });

  const result: ScanResult = {
    ip: device.ip,
    services,
    responseTime: 0, // Not available from backend
  };

  // Add hostname if available
  if (device.hostname) {
    // Note: hostname is not part of the standard ScanResult interface
    // You may need to extend the interface if needed
  }

  return result;
};

/**
 * Start a backend scan
 */
export const startBackendScan = async (ipRange: string): Promise<string> => {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ip_range: ipRange } as BackendScanRequest),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Backend scan failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const result: BackendScanResponse = await response.json();
  return result.task_id;
};

/**
 * Get backend scan status
 */
export const getBackendScanStatus = async (taskId: string): Promise<{
  status: string;
  progress: number;
  results: ScanResult[];
}> => {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/scan/status?task_id=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Backend scan status failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const result: BackendScanStatusResponse = await response.json();
  
  return {
    status: result.status,
    progress: result.progress,
    results: result.results.map(convertBackendDevice),
  };
};

/**
 * Stop a backend scan
 */
export const stopBackendScan = async (taskId: string): Promise<void> => {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/scan/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task_id: taskId } as BackendScanStopRequest),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Backend scan stop failed: ${response.status} ${response.statusText} - ${errorData}`);
  }
};

/**
 * Backend scan with progress polling
 */
export const backendScanWithProgress = async (
  ipRange: string,
  onProgress?: (progress: number, status: string, results: ScanResult[]) => void,
  onComplete?: (results: ScanResult[]) => void,
  pollInterval = 1000
): Promise<ScanResult[]> => {
  try {
    // Start the scan
    const taskId = await startBackendScan(ipRange);
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await getBackendScanStatus(taskId);
          
          // Report progress
          onProgress?.(status.progress, status.status, status.results);
          
          if (status.status === 'completed') {
            onComplete?.(status.results);
            resolve(status.results);
          } else if (status.status === 'error' || status.status === 'cancelled') {
            reject(new Error(`Scan ${status.status}`));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Start polling
      setTimeout(poll, pollInterval);
    });
  } catch (error) {
    throw new Error(`Backend scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Frontend Scanning Functions (Legacy)
 */

/**
 * Scan multiple subnets for MikroTik devices
 */
export const scanSubnets = async (
  subnets: string[],
  onProgress?: (progress: ScanProgress) => void,
  onHostFound?: (result: ScanResult) => void,
  username: string = 'admin',
  password: string = ''
): Promise<ScanResult[]> => {
  const config = getScanConfig();
  const results: ScanResult[] = [];
  
  // Validate all subnets
  const validSubnets = subnets.filter(subnet => {
    if (!isValidSubnet(subnet)) {
      console.error(`Invalid subnet: ${subnet}`);
      return false;
    }
    return true;
  });
  
  if (validSubnets.length === 0) {
    throw new Error('No valid subnets provided');
  }
  
  // Calculate total IPs across all subnets
  const allIps: string[] = [];
  for (const subnet of validSubnets) {
    allIps.push(...getSubnetIps(subnet));
  }
  
  // Initialize scan state
  const abortController = new AbortController();
  const progress: MutableScanProgress = {
    totalHosts: allIps.length,
    scannedHosts: 0,
    foundHosts: 0,
    currentHost: '',
    estimatedTimeRemaining: 0,
    startTime: Date.now(),
    errors: [] as string[],
  };
  
  activeScan = {
    abortController,
    progress,
    startTime: Date.now(),
  };
  
  // Create chunks for parallel scanning
  const chunks: string[][] = [];
  for (let i = 0; i < allIps.length; i += MAX_CONCURRENT_SCANS) {
    chunks.push(allIps.slice(i, i + MAX_CONCURRENT_SCANS));
  }
  
  // Process chunks
  for (const chunk of chunks) {
    if (abortController.signal.aborted) break;
    
    const promises = chunk.map(async (ip) => {
      if (abortController.signal.aborted) return null;
      
      progress.currentHost = ip;
      
      try {
        const result = await scanHost(ip, config, abortController.signal, username, password);
        
        progress.scannedHosts++;
        
        if (result) {
          progress.foundHosts++;
          results.push(result);
          onHostFound?.(result);
        }
        
        // Calculate estimated time remaining
        const elapsed = Date.now() - progress.startTime;
        const averageTime = elapsed / progress.scannedHosts;
        const remaining = allIps.length - progress.scannedHosts;
        progress.estimatedTimeRemaining = Math.round(averageTime * remaining);
        
        onProgress?.(progress);
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        progress.errors.push(`Failed to scan ${ip}: ${errorMessage}`);
        return null;
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  // Clear active scan state
  activeScan = null;
  saveLastScanTime();
  
  return results;
};

/**
 * Scan a single subnet for MikroTik devices
 */
export const scanSubnet = async (
  subnet?: string,
  onProgress?: (progress: number, currentIp: string) => void,
  onHostFound?: (result: ScanResult) => void
): Promise<ScanResult[]> => {
  const config = getScanConfig();
  const targetSubnet = subnet ?? config.subnet;
  
  // Use the enhanced multi-subnet scanner
  return scanSubnets(
    [targetSubnet],
    (progress) => {
      onProgress?.(
        progress.scannedHosts / progress.totalHosts,
        progress.currentHost
      );
    },
    onHostFound
  );
};

/**
 * Quick scan for a specific IP address
 */
export const quickScan = async (
  ip: string, 
  username: string = 'admin', 
  password: string = ''
): Promise<ScanResult | null> => {
  const config = getScanConfig();
  
  // Use all MikroTik ports for quick scan
  const enhancedConfig: ScanConfig = {
    ...config,
    ports: Object.values(MIKROTIK_PORTS),
  };
  
  return scanHost(ip, enhancedConfig, undefined, username, password);
};

/**
 * Check if a host is a MikroTik router based on services
 */
export const isMikroTikRouter = (result: ScanResult): boolean => {
  return result.services.some(service => 
    service.service === 'mikrotik-api' || 
    service.service === 'mikrotik-api-ssl' ||
    service.service === 'mikrotik-rest' ||
    service.service === 'mikrotik-rest-ssl' ||
    service.service === 'winbox' ||
    service.port === 8728 ||
    service.port === 8729 ||
    service.port === 8291 ||
    (service.port === 80 && service.service.includes('mikrotik')) ||
    (service.port === 443 && service.service.includes('mikrotik'))
  );
};

/**
 * Estimate scan duration for multiple subnets
 */
export const estimateScanDuration = (subnets: string[]): number => {
  let totalIps = 0;
  
  for (const subnet of subnets) {
    if (isValidSubnet(subnet)) {
      totalIps += getSubnetIps(subnet).length;
    }
  }
  
  if (totalIps === 0) return 0;
  
  const config = getScanConfig();
  
  // Estimate based on concurrent scanning with rate limiting
  const effectiveRate = Math.min(
    MAX_CONCURRENT_SCANS,
    RATE_LIMIT.requestsPerSecond
  );
  
  // Account for multiple ports per host
  const portsPerHost = config.ports.length || 1;
  const totalRequests = totalIps * portsPerHost;
  
  // Calculate time in seconds
  const baseTime = totalRequests / effectiveRate;
  const overheadFactor = 1.2; // Add 20% overhead for network delays
  
  return Math.ceil(baseTime * overheadFactor);
};

/**
 * Validate scan configuration
 */
export const validateScanConfig = (config: Partial<ScanConfig>): string[] => {
  const errors: string[] = [];
  
  if (config.subnet && !isValidSubnet(config.subnet)) {
    errors.push('Invalid subnet format. Use CIDR notation (e.g., 192.168.1.0/24)');
  }
  
  if (config.timeout !== undefined) {
    if (config.timeout < 100) {
      errors.push('Timeout too low. Minimum is 100ms');
    }
    if (config.timeout > 30000) {
      errors.push('Timeout too high. Maximum is 30000ms');
    }
  }
  
  if (config.ports) {
    if (config.ports.length === 0) {
      errors.push('At least one port must be specified');
    }
    
    if (config.ports.length > 20) {
      errors.push('Too many ports. Maximum is 20');
    }
    
    const invalidPorts = config.ports.filter(port => port < 1 || port > 65535);
    if (invalidPorts.length > 0) {
      errors.push(`Invalid ports: ${invalidPorts.join(', ')}. Ports must be between 1 and 65535`);
    }
  }
  
  return errors;
};

/**
 * Cancel active scan
 */
export const cancelScan = (): boolean => {
  if (activeScan) {
    activeScan.abortController.abort();
    activeScan = null;
    return true;
  }
  return false;
};

/**
 * Get current scan progress
 */
export const getScanProgress = (): ScanProgress | null => {
  return activeScan?.progress as ScanProgress || null;
};

/**
 * Get recommended scan configuration for network size
 */
export const getRecommendedConfig = (subnet: string): Partial<ScanConfig> => {
  if (!isValidSubnet(subnet)) {
    return {};
  }
  
  const ips = getSubnetIps(subnet);
  const hostCount = ips.length;
  
  // Adjust timeout and ports based on network size
  if (hostCount <= 256) {
    // Small network - comprehensive scan
    return {
      timeout: 3000,
      ports: [
        MIKROTIK_PORTS.WEB,
        MIKROTIK_PORTS.WEB_SSL,
        MIKROTIK_PORTS.API,
        MIKROTIK_PORTS.API_SSL,
        MIKROTIK_PORTS.WINBOX,
      ],
    };
  } else if (hostCount <= 1024) {
    // Medium network - balanced scan
    return {
      timeout: 2000,
      ports: [
        MIKROTIK_PORTS.WEB_SSL,
        MIKROTIK_PORTS.API_SSL,
        MIKROTIK_PORTS.WINBOX,
      ],
    };
  } else {
    // Large network - fast scan
    return {
      timeout: 1000,
      ports: [
        MIKROTIK_PORTS.API_SSL,
        MIKROTIK_PORTS.WINBOX,
      ],
    };
  }
};

/**
 * Discover RouterOS devices using multiple methods
 */
export const discoverRouterOSDevices = async (
  subnets: string[],
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult[]> => {
  // Use optimized configuration for RouterOS discovery
  const config = getScanConfig();
  const routerOSConfig: ScanConfig = {
    ...config,
    ports: [
      MIKROTIK_PORTS.API_SSL,
      MIKROTIK_PORTS.API,
      MIKROTIK_PORTS.WINBOX,
    ],
    timeout: 2000,
  };
  
  // Temporarily override config
  const originalConfig = { ...config };
  Object.assign(config, routerOSConfig);
  
  try {
    const results = await scanSubnets(subnets, onProgress);
    
    // Filter to only RouterOS devices
    return results.filter(isMikroTikRouter);
  } finally {
    // Restore original config
    Object.assign(config, originalConfig);
  }
};

/**
 * Ultra-fast scanning of entire 192.168.0.0/16 range using fast scanner
 * Optimized for discovering RouterOS devices at maximum speed
 */
export const ultraFastScan = async (
  onProgress?: (progress: FastScanProgress) => void,
  onHostFound?: (result: ScanResult) => void,
  customConfig?: Partial<FastScanConfig>
): Promise<FastScanResult> => {
  const optimizedConfig = customConfig ? 
    { ...getOptimizedFastScanConfig(), ...customConfig } :
    getOptimizedFastScanConfig();
  
  // Validate configuration
  const configErrors = validateFastScanConfig(optimizedConfig);
  if (configErrors.length > 0) {
    throw new Error(`Invalid fast scan configuration: ${configErrors.join(', ')}`);
  }
  
  try {
    const result = await fastScanEntireRange(
      optimizedConfig,
      onProgress,
      onHostFound
    );
    
    saveLastScanTime();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Ultra-fast scan failed:', errorMessage);
    throw new Error(`Fast scan failed: ${errorMessage}`);
  }
};

/**
 * Fast scanning of specific subnets within 192.168.0.0/16 range
 */
export const fastSubnetScan = async (
  subnets: readonly number[], // e.g., [1, 2, 10] for 192.168.1.0/24, etc.
  onProgress?: (progress: FastScanProgress) => void,
  onHostFound?: (result: ScanResult) => void,
  customConfig?: Partial<FastScanConfig>
): Promise<FastScanResult> => {
  const optimizedConfig = customConfig ? 
    { ...getOptimizedFastScanConfig(), ...customConfig } :
    getOptimizedFastScanConfig();
  
  try {
    const result = await fastScanSubnets(
      subnets,
      optimizedConfig,
      onProgress,
      onHostFound
    );
    
    saveLastScanTime();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fast subnet scan failed:', errorMessage);
    throw new Error(`Fast subnet scan failed: ${errorMessage}`);
  }
};

/**
 * Get estimated duration for ultra-fast scan
 */
export const getUltraFastScanEstimate = (config?: Partial<FastScanConfig>): number => {
  return estimateFastScanDuration(config);
};

/**
 * Cancel active ultra-fast scan
 */
export const cancelUltraFastScan = (): boolean => {
  return cancelFastScan();
};

/**
 * Get current ultra-fast scan progress
 */
export const getUltraFastScanProgress = (): FastScanProgress | null => {
  return getFastScanProgress();
};

/**
 * Check if ultra-fast scanning is supported in current environment
 */
export const isUltraFastScanSupported = (): boolean => {
  try {
    // Check for Web Worker support
    if (typeof Worker === 'undefined') {
      return false;
    }
    
    // Check for required APIs
    if (typeof fetch === 'undefined' || typeof AbortController === 'undefined') {
      return false;
    }
    
    // Check for performance API
    if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Get recommended scan method based on requirements
 */
export const getRecommendedScanMethod = (
  targetIpCount: number,
  timeRequirement: number // seconds
): 'standard' | 'fast' | 'ultra-fast' | 'progressive' => {
  // For large IP ranges with tight time requirements, use progressive or ultra-fast
  if (targetIpCount > 1000 && timeRequirement < 120) {
    return 'progressive'; // Progressive is now the fastest for real-time results
  }
  
  // For medium ranges, use progressive or fast scanning
  if (targetIpCount > 100 && timeRequirement < 300) {
    return 'progressive';
  }
  
  // For small ranges or relaxed time requirements, use standard
  return 'standard';
};

/**
 * Subnet Detection Functions
 */

/**
 * Detects active subnets in the current environment
 */
export const detectCurrentSubnets = async (): Promise<SubnetDetectionResult> => {
  try {
    return await detectActiveSubnets();
  } catch (error) {
    console.error('Subnet detection failed:', error);
    throw new Error(`Subnet detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets the fastest scan subnets (top 3 by confidence)
 */
export const getFastScanSubnets = async (): Promise<DetectedSubnet[]> => {
  try {
    return await getFastestScanSubnets();
  } catch (error) {
    console.error('Fast subnet detection failed:', error);
    throw new Error(`Fast subnet detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clears subnet detection cache
 */
export const clearSubnetDetectionCache = (): void => {
  clearSubnetCache();
};

/**
 * Progressive Scanner Functions
 */

/**
 * Starts a progressive scan with real-time results
 */
export const startUltraFastProgressiveScan = async (
  config: Partial<ProgressiveScanConfig> = {},
  callbacks: ProgressiveScanCallbacks = {},
  username: string = 'admin',
  password: string = ''
): Promise<readonly ProgressiveResult[]> => {
  // Start performance monitoring
  resetPerformanceMonitoring();
  startPerformanceMonitoring(callbacks.onProgressUpdate ? (alert) => {
    console.log('Performance alert:', alert);
  } : undefined);

  const defaultConfig: ProgressiveScanConfig = {
    maxConcurrentWorkers: 50,
    timeoutPerIp: 150,
    username,
    password,
    maxResults: 100,
    maxScanTime: 120000, // 2 minutes
    prioritySubnetsOnly: false,
    showProgress: true,
    ...config,
  };

  try {
    const results = await startProgressiveScan(defaultConfig, callbacks);
    saveLastScanTime();
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Progressive scan failed:', errorMessage);
    throw new Error(`Progressive scan failed: ${errorMessage}`);
  }
};

/**
 * Starts a quick gateway scan (only gateway IPs)
 */
export const startQuickGatewayScan = async (
  username: string = 'admin',
  password: string = '',
  onDeviceFound?: (result: ProgressiveResult) => void
): Promise<readonly ProgressiveResult[]> => {
  // First detect subnets
  const subnetDetection = await detectActiveSubnets();
  
  if (subnetDetection.detectedSubnets.length === 0) {
    throw new Error('No active subnets detected for quick scan');
  }

  const config: ProgressiveScanConfig = {
    maxConcurrentWorkers: 10,
    timeoutPerIp: 200,
    username,
    password,
    maxScanTime: 15000, // 15 seconds
    prioritySubnetsOnly: true, // Only scan top priority subnets
    showProgress: false,
  };

  const callbacks: ProgressiveScanCallbacks = onDeviceFound 
    ? { onDeviceFound }
    : {};

  return await startProgressiveScan(config, callbacks);
};

/**
 * Stops current progressive scan
 */
export const stopCurrentProgressiveScan = (): boolean => {
  return stopProgressiveScan();
};

/**
 * Gets current progressive scan state
 */
export const getCurrentProgressiveScanState = (): ProgressiveScanState | null => {
  return getProgressiveScanState();
};

/**
 * Checks if progressive scan is running
 */
export const isProgressiveScanActive = (): boolean => {
  return isProgressiveScanRunning();
};

/**
 * Gets current progressive scan results
 */
export const getProgressiveScanResults = (): readonly ProgressiveResult[] => {
  return getCurrentProgressiveResults();
};

/**
 * Performance Monitoring Functions
 */

/**
 * Gets current performance metrics
 */
export const getScanPerformanceMetrics = (): GlobalPerformanceMetrics => {
  return getGlobalPerformance();
};

/**
 * Gets performance alerts
 */
export const getScanPerformanceAlerts = (): readonly PerformanceAlert[] => {
  return getPerformanceAlerts();
};

/**
 * Resets performance monitoring
 */
export const resetScanPerformanceMonitoring = (): void => {
  resetPerformanceMonitoring();
};

/**
 * Integrated Scanning Functions
 */

/**
 * Auto-detects best scan method and executes it
 */
export const autoScan = async (
  username: string = 'admin',
  password: string = '',
  onProgress?: (state: ProgressiveScanState) => void,
  onDeviceFound?: (result: ProgressiveResult) => void
): Promise<readonly ProgressiveResult[]> => {
  try {
    // First detect subnets
    console.log('🔍 Auto-scan: Detecting active subnets...');
    const subnetDetection = await detectActiveSubnets();
    
    const totalIPs = subnetDetection.totalIpsToScan;
    console.log(`📊 Auto-scan: ${subnetDetection.detectedSubnets.length} subnets detected, ${totalIPs} IPs to scan`);
    
    // Determine best scan method
    const scanMethod = getRecommendedScanMethod(totalIPs, 120); // 2 minute target
    console.log(`🎯 Auto-scan: Using ${scanMethod} method`);
    
    // Configure based on detected environment
    const config: ProgressiveScanConfig = {
      maxConcurrentWorkers: Math.min(50, Math.max(10, Math.floor(totalIPs / 20))),
      timeoutPerIp: totalIPs > 1000 ? 100 : 150,
      username,
      password,
      maxResults: Math.min(100, totalIPs),
      maxScanTime: 120000, // 2 minutes
      prioritySubnetsOnly: totalIPs > 2000, // Use priority subnets for large scans
      showProgress: true,
    };
    
    const callbacks: ProgressiveScanCallbacks = {
      ...(onProgress && { onProgressUpdate: onProgress }),
      ...(onDeviceFound && { onDeviceFound })
    };
    
    return await startUltraFastProgressiveScan(config, callbacks, username, password);
    
  } catch (error) {
    console.error('Auto-scan failed:', error);
    throw new Error(`Auto-scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets scan efficiency score based on current performance
 */
export const getScanEfficiencyScore = (): number => {
  const performance = getScanPerformanceMetrics();
  return performance.efficiency;
};

/**
 * Gets scan optimization recommendations
 */
export const getScanOptimizationTips = (): string[] => {
  const performance = getScanPerformanceMetrics();
  const alerts = getScanPerformanceAlerts();
  const tips: string[] = [];
  
  if (performance.efficiency < 0.5) {
    tips.push('Reduce concurrency to improve scan stability');
  }
  
  if (performance.globalAverageResponseTime > 300) {
    tips.push('Increase timeout values to reduce failures');
  }
  
  if (performance.scansPerSecond < 50) {
    tips.push('Increase concurrency to improve scan speed');
  }
  
  if (alerts.some(a => a.type === 'slow_subnet')) {
    tips.push('Consider skipping slow-responding subnets');
  }
  
  if (alerts.some(a => a.type === 'high_timeout_rate')) {
    tips.push('Network may be congested - reduce scan intensity');
  }
  
  return tips;
};

/**
 * Auto-Scan Gateway Functions
 */

/**
 * Automatically scan all 192.168.x.1 gateway IPs for HTTP APIs
 */
export const autoScanGateways = async (
  onProgress?: (progress: number, status: string, results: ScanResult[]) => void,
  onComplete?: (results: ScanResult[]) => void
): Promise<ScanResult[]> => {
  try {
    // Check if backend is available
    if (!await isBackendAvailable()) {
      throw new Error('Backend is not available for auto-scanning');
    }

    console.log('🔍 Starting automatic gateway scan (192.168.0-255.1)...');
    
    // Start the auto scan
    const taskId = await startAutoScan();
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await getBackendScanStatus(taskId);
          
          // Report progress
          onProgress?.(status.progress, status.status, status.results);
          
          if (status.status === 'completed') {
            console.log(`✅ Auto-scan completed! Found ${status.results.length} HTTP API endpoints`);
            onComplete?.(status.results);
            resolve(status.results);
          } else if (status.status === 'error' || status.status === 'cancelled') {
            reject(new Error(`Auto-scan ${status.status}`));
          } else {
            // Continue polling every 2 seconds
            setTimeout(poll, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Start polling after 1 second
      setTimeout(poll, 1000);
    });
  } catch (error) {
    throw new Error(`Auto-scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Start automatic gateway scan
 */
export const startAutoScan = async (): Promise<string> => {
  const backendUrl = getBackendBaseUrl();
  const response = await fetch(`${backendUrl}/api/scan/auto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // No parameters needed for gateway scan
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Auto-scan failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const result = await response.json();
  return result.task_id;
};

/**
 * Start auto-scan and return results as they come in real-time
 */
export const startAutoScanWithRealTimeResults = async (
  onDeviceFound?: (result: ScanResult) => void,
  onProgress?: (progress: number, status: string) => void
): Promise<ScanResult[]> => {
  const results: ScanResult[] = [];
  
  const autoScanResults = await autoScanGateways(
    (progress, status, currentResults) => {
      // Check for new results
      const newResults = currentResults.slice(results.length);
      newResults.forEach(result => {
        results.push(result);
        onDeviceFound?.(result);
      });
      
      onProgress?.(progress, status);
    },
    (finalResults) => {
      console.log(`🎯 Auto-scan complete: ${finalResults.length} HTTP API endpoints discovered`);
    }
  );
  
  return autoScanResults;
};

/**
 * Check if auto-scanning is supported in the current environment
 */
export const isAutoScanSupported = async (): Promise<boolean> => {
  try {
    // Check if backend is available
    console.log('🔍 Checking backend availability...');
    const backendAvailable = await isBackendAvailable();
    console.log(`🔍 Backend available: ${backendAvailable}`);
    if (!backendAvailable) {
      return false;
    }
    
    // Check for required browser APIs
    if (typeof fetch === 'undefined' || typeof AbortController === 'undefined') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Get auto-scan configuration recommendations
 */
export const getAutoScanConfig = (): {
  targetRange: string;
  estimatedDuration: number;
  totalIPs: number;
  httpPortsOnly: boolean;
} => {
  return {
    targetRange: '192.168.0-255.1',
    estimatedDuration: 30, // seconds
    totalIPs: 256,
    httpPortsOnly: true,
  };
};

/**
 * Unified Scanning Interface
 */

/**
 * Check if backend is available
 */
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const backendUrl = getBackendBaseUrl();
    console.log(`🌐 Testing backend at: ${backendUrl}/health`);
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    console.log(`📡 Backend response: ${response.status} ${response.statusText}`);
    return response.ok;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

/**
 * Smart scan that automatically chooses backend or frontend
 */
export const smartScan = async (
  ipRange: string,
  onProgress?: (progress: number, status: string, results: ScanResult[]) => void,
  onComplete?: (results: ScanResult[]) => void,
  useBackendFirst = true
): Promise<ScanResult[]> => {
  if (useBackendFirst && await isBackendAvailable()) {
    console.log('🚀 Using backend scanning for optimal performance');
    return await backendScanWithProgress(ipRange, onProgress, onComplete);
  } else {
    console.log('📡 Using frontend scanning (backend unavailable)');
    // Convert CIDR to subnet list for frontend scanner
    const subnets = [ipRange];
    return new Promise((resolve, reject) => {
      const results: ScanResult[] = [];
      
      scanSubnets(
        subnets,
        (progress) => {
          const progressPercent = Math.round((progress.scannedHosts / progress.totalHosts) * 100);
          onProgress?.(progressPercent, 'running', results);
        },
        (result) => {
          results.push(result);
        }
      ).then((finalResults) => {
        onComplete?.(finalResults);
        resolve(finalResults);
      }).catch(reject);
    });
  }
};

/**
 * Get backend connection status
 */
export const getBackendStatus = async (): Promise<{
  available: boolean;
  url: string;
  version?: string;
  error?: string;
}> => {
  const backendUrl = getBackendBaseUrl();
  
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        url: backendUrl,
        version: data.version || 'unknown',
      };
    } else {
      return {
        available: false,
        url: backendUrl,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      available: false,
      url: backendUrl,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
};