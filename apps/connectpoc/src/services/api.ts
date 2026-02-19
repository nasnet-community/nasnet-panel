import { getAuthHeaderForRouter } from './auth';
import { getRouterCredentials } from './auth-config';

import type { 
  ApiResponse, 
  RouterInfo, 
  SystemResource, 
  RouterInterface, 
  IpAddress, 
  DhcpClient,
  ConfigBackup,
  ApiError,
  RouterOSRequestOptions,
  RouterOSAPIError,
  WirelessInterface,
  WirelessSecurityProfile
} from '@shared/routeros';

/**
 * RouterOS REST API service for communicating with MikroTik routers
 * Now uses Go backend proxy for CORS-free communication
 * 
 * Backend Proxy Requirements:
 * - Go backend running on API_BASE_URL (default: http://localhost:8080)
 * - Proxy endpoint: POST /api/router/proxy
 * - Request format: { router_ip, endpoint, method, headers, body }
 * - Automatic HTTPS/HTTP protocol detection
 */

/** Backend API configuration */
interface BackendApiConfig {
  readonly timeout: number;
  readonly retries: number;
  readonly retryDelay: number;
  readonly baseUrl: string;
}

// Get backend URL from environment or use relative paths for same-origin requests
const getBackendBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Browser environment - check for build-time environment variables
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl) return envUrl;
    
    // Use same origin (relative paths) when running in production container
    return '';
  }
  
  // Server-side rendering fallback - use relative paths
  return '';
};

const defaultConfig: BackendApiConfig = {
  timeout: 30000, // Increased for backend proxy requests
  retries: 3,
  retryDelay: 1000,
  baseUrl: getBackendBaseUrl(),
};

/** Backend proxy request interface */
interface BackendProxyRequest {
  router_ip: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

/** Backend proxy response interface */
interface BackendProxyResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: any;
}

/**
 * Configure backend proxy settings (legacy compatibility)
 * @deprecated Use environment variable VITE_API_BASE_URL instead
 */
export const configureCORSProxy = (_config: any): void => {
  console.warn('configureCORSProxy is deprecated. Use VITE_API_BASE_URL environment variable instead.');
};

/**
 * Build RouterOS REST API endpoint path
 * Official format: /rest/path
 */
const buildRouterOSEndpoint = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Official RouterOS REST API format
  return `/rest/${cleanEndpoint}`;
};

/**
 * Convert RouterOS field names from kebab-case to camelCase
 * Note: RouterOS REST API returns all values as strings
 */
const convertRouterOSResponse = <T>(data: any): T => {
  if (Array.isArray(data)) {
    return data.map(item => convertRouterOSResponse(item)) as T;
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = convertRouterOSResponse(value);
    }
    return converted as T;
  }
  
  return data as T;
};

/**
 * Makes an authenticated REST API request to a RouterOS device via backend proxy
 */
export const makeRouterOSRequest = async <T>(
  routerIp: string,
  endpoint: string,
  options: RouterOSRequestOptions = {},
  config: Partial<BackendApiConfig> = {}
): Promise<ApiResponse<T>> => {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Use getAuthHeaderForRouter which has fallback logic for default credentials
  const authHeader = getAuthHeaderForRouter(routerIp);
  if (!authHeader) {
    return {
      success: false,
      error: 'No valid authentication header found',
      timestamp: Date.now(),
    };
  }
  
  let lastError: string = 'Unknown error occurred';
  
  for (let attempt = 0; attempt < finalConfig.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
      
      // Build proxy request
      const proxyRequest: BackendProxyRequest = {
        router_ip: routerIp,
        endpoint: buildRouterOSEndpoint(endpoint),
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader,
          ...options.headers,
        },
      };
      
      // Add body if present
      if (options.body && options.method !== 'GET') {
        proxyRequest.body = options.body;
      }
      
      // Make request to backend proxy
      const backendUrl = `${finalConfig.baseUrl}/api/router/proxy`;
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyRequest),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `Backend proxy error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Unable to parse error response
        }
        throw new Error(errorMessage);
      }
      
      // Parse proxy response
      const proxyResponse: BackendProxyResponse = await response.json();
      
      // Handle RouterOS response status
      if (proxyResponse.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please check credentials.',
          timestamp: Date.now(),
        };
      } else if (proxyResponse.status === 403) {
        return {
          success: false,
          error: 'Access denied. Insufficient permissions.',
          timestamp: Date.now(),
        };
      } else if (proxyResponse.status === 404) {
        return {
          success: false,
          error: 'Resource not found. Check RouterOS version and endpoint.',
          timestamp: Date.now(),
        };
      } else if (proxyResponse.status < 200 || proxyResponse.status >= 300) {
        throw new Error(`RouterOS error: ${proxyResponse.status} ${proxyResponse.status_text}`);
      }
      
      // Parse successful response
      const convertedData = convertRouterOSResponse<T>(proxyResponse.body);
      
      return {
        success: true,
        data: convertedData,
        timestamp: Date.now(),
      };
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = 'Request timeout. Backend or router may be unreachable.';
        } else if (error.message.includes('Failed to fetch')) {
          lastError = 'Network error. Check backend connectivity.';
        } else {
          lastError = error.message;
        }
      }
      
      // Retry if not the last attempt
      if (attempt < finalConfig.retries - 1) {
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    timestamp: Date.now(),
  };
};

/**
 * Get system resource information
 * REST API endpoint: /rest/system/resource
 */
export const getSystemResource = async (routerIp: string): Promise<ApiResponse<SystemResource>> => {
  return makeRouterOSRequest<SystemResource>(routerIp, 'system/resource');
};

/**
 * Get RouterOS version information
 * REST API endpoint: /rest/system/resource (includes version info)
 */
export const getRouterOSVersion = async (routerIp: string): Promise<ApiResponse<{ version: string; buildTime: string }>> => {
  const result = await makeRouterOSRequest<SystemResource>(routerIp, 'system/resource');
  
  if (result.success && result.data) {
    return {
      success: true,
      data: {
        version: result.data.version,
        buildTime: result.data.buildTime,
      },
      timestamp: result.timestamp,
    };
  }
  
  return {
    success: false,
    error: result.error || 'Failed to get RouterOS version',
    timestamp: Date.now(),
  };
};

/**
 * Get all network interfaces
 * REST API endpoint: /rest/interface
 */
export const getInterfaces = async (routerIp: string): Promise<ApiResponse<RouterInterface[]>> => {
  return makeRouterOSRequest<RouterInterface[]>(routerIp, 'interface');
};

/**
 * Get wireless interfaces
 * REST API endpoint: /rest/interface/wireless
 */
export const getWirelessInterfaces = async (routerIp: string): Promise<ApiResponse<WirelessInterface[]>> => {
  return makeRouterOSRequest<WirelessInterface[]>(routerIp, 'interface/wireless');
};

/**
 * Get wireless security profiles
 * REST API endpoint: /rest/interface/wireless/security-profiles
 */
export const getWirelessSecurityProfiles = async (routerIp: string): Promise<ApiResponse<WirelessSecurityProfile[]>> => {
  return makeRouterOSRequest<WirelessSecurityProfile[]>(routerIp, 'interface/wireless/security-profiles');
};

/**
 * Update wireless interface configuration
 * REST API endpoint: /rest/interface/wireless/{id}
 */
export const updateWirelessInterface = async (
  routerIp: string,
  interfaceId: string,
  config: Partial<WirelessInterface>
): Promise<ApiResponse<void>> => {
  // Convert camelCase to kebab-case for RouterOS
  const routerOSConfig: any = {};
  for (const [key, value] of Object.entries(config)) {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    routerOSConfig[kebabKey] = value;
  }
  
  return makeRouterOSRequest<void>(routerIp, `interface/wireless/${interfaceId}`, {
    method: 'PATCH',
    body: routerOSConfig,
  });
};

/**
 * Get IP addresses
 * REST API endpoint: /rest/ip/address
 */
export const getIpAddresses = async (routerIp: string): Promise<ApiResponse<IpAddress[]>> => {
  return makeRouterOSRequest<IpAddress[]>(routerIp, 'ip/address');
};

/**
 * Get DHCP clients
 * REST API endpoint: /rest/ip/dhcp-client
 */
export const getDhcpClients = async (routerIp: string): Promise<ApiResponse<DhcpClient[]>> => {
  return makeRouterOSRequest<DhcpClient[]>(routerIp, 'ip/dhcp-client');
};

/**
 * Get DHCP server leases
 * REST API endpoint: /rest/ip/dhcp-server/lease
 */
export const getDhcpServerLeases = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/dhcp-server/lease');
};

/**
 * Create a configuration backup
 * REST API endpoint: /rest/system/backup/save
 */
export const createBackup = async (routerIp: string, name?: string): Promise<ApiResponse<ConfigBackup>> => {
  const backupName = name ?? `backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  return makeRouterOSRequest<ConfigBackup>(routerIp, 'system/backup/save', {
    method: 'POST',
    body: { name: backupName },
  });
};

/**
 * Reboot the router
 * REST API endpoint: /rest/system/reboot
 */
export const rebootRouter = async (routerIp: string): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, 'system/reboot', {
    method: 'POST',
  });
};

/**
 * Update router identity
 * REST API endpoint: /rest/system/identity
 */
export const updateIdentity = async (routerIp: string, name: string): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(routerIp, 'system/identity', {
    method: 'PUT',
    body: { name },
  });
};

/**
 * Get router identity
 * REST API endpoint: /rest/system/identity
 */
export const getIdentity = async (routerIp: string): Promise<ApiResponse<{ name: string }>> => {
  return makeRouterOSRequest<{ name: string }>(routerIp, 'system/identity');
};

/**
 * Test connection to router
 * Uses /rest/system/identity endpoint to verify connectivity and authentication
 */
export const testRouterConnection = async (routerIp: string): Promise<ApiResponse<{ 
  connected: boolean; 
  routerName?: string; 
  version?: string; 
}>> => {
  try {
    // Test with identity endpoint
    const identityResult = await getIdentity(routerIp);
    
    if (identityResult.success) {
      // Also try to get version info
      const versionResult = await getRouterOSVersion(routerIp);
      
      const data: { connected: boolean; routerName?: string; version?: string } = {
        connected: true,
      };
      
      if (identityResult.data?.name) {
        data.routerName = identityResult.data.name;
      }
      
      if (versionResult.success && versionResult.data?.version) {
        data.version = versionResult.data.version;
      }
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    }
    
    return {
      success: false,
      error: identityResult.error || 'Connection test failed',
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      timestamp: Date.now(),
    };
  }
};

/**
 * Enable/disable an interface
 * REST API endpoint: /rest/interface/{id}
 */
export const toggleInterface = async (
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
 * Get router information combining multiple endpoints
 */
export const getRouterInfo = async (routerIp: string): Promise<ApiResponse<RouterInfo>> => {
  try {
    // Fetch system resource and identity in parallel
    const [systemResponse, identityResponse] = await Promise.all([
      getSystemResource(routerIp),
      getIdentity(routerIp),
    ]);
    
    if (!systemResponse.success || !systemResponse.data) {
      return {
        success: false,
        error: systemResponse.error ?? 'Failed to get system resources',
        timestamp: Date.now(),
      };
    }
    
    const routerName = identityResponse.success && identityResponse.data 
      ? identityResponse.data.name 
      : 'MikroTik Router';
    
    const routerInfo: RouterInfo = {
      id: routerIp,
      name: routerName,
      ip: routerIp,
      model: systemResponse.data.boardName,
      version: systemResponse.data.version,
      uptime: parseUptime(systemResponse.data.uptime),
      status: 'online',
    };
    
    return {
      success: true,
      data: routerInfo,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get router info',
      timestamp: Date.now(),
    };
  }
};

/**
 * Execute a RouterOS command via REST API
 * REST API endpoint: /rest/console/command
 * Note: Requires RouterOS v7.9+
 */
export const executeCommand = async (
  routerIp: string,
  command: string
): Promise<ApiResponse<string>> => {
  return makeRouterOSRequest<string>(routerIp, 'console/command', {
    method: 'POST',
    body: { command },
  });
};

/**
 * Get firewall filter rules
 * REST API endpoint: /rest/ip/firewall/filter
 */
export const getFirewallRules = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/firewall/filter');
};

/**
 * Get NAT rules
 * REST API endpoint: /rest/ip/firewall/nat
 */
export const getNATRules = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/firewall/nat');
};

/**
 * Get routing table
 * REST API endpoint: /rest/ip/route
 */
export const getRoutes = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/route');
};

/**
 * Get ARP table
 * REST API endpoint: /rest/ip/arp
 */
export const getARPTable = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/arp');
};

/**
 * Get connected users (hotspot/PPP)
 * REST API endpoint: /rest/ip/hotspot/active
 */
export const getHotspotUsers = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ip/hotspot/active');
};

/**
 * Get active PPP connections
 * REST API endpoint: /rest/ppp/active
 */
export const getPPPConnections = async (routerIp: string): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ppp/active');
};

/**
 * Get system logs
 * REST API endpoint: /rest/log
 */
export const getSystemLogs = async (routerIp: string, limit = 100): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, `log?limit=${limit}`);
};

/** Parse uptime string to seconds */
const parseUptime = (uptime: string): number => {
  let totalSeconds = 0;
  
  // Parse weeks (w)
  const weekMatch = uptime.match(/(\d+)w/);
  if (weekMatch?.[1]) totalSeconds += parseInt(weekMatch[1]) * 604800;
  
  // Parse days (d)
  const dayMatch = uptime.match(/(\d+)d/);
  if (dayMatch?.[1]) totalSeconds += parseInt(dayMatch[1]) * 86400;
  
  // Parse hours (h)
  const hourMatch = uptime.match(/(\d+)h/);
  if (hourMatch?.[1]) totalSeconds += parseInt(hourMatch[1]) * 3600;
  
  // Parse minutes (m)
  const minuteMatch = uptime.match(/(\d+)m/);
  if (minuteMatch?.[1]) totalSeconds += parseInt(minuteMatch[1]) * 60;
  
  // Parse seconds (s)
  const secondMatch = uptime.match(/(\d+)s/);
  if (secondMatch?.[1]) totalSeconds += parseInt(secondMatch[1]);
  
  return totalSeconds;
};

/** Map API errors to user-friendly messages */
export const getErrorMessage = (error: ApiError): string => {
  const errorMessages: Record<ApiError, string> = {
    AUTH_FAILED: 'Authentication failed. Please check your credentials.',
    CONNECTION_TIMEOUT: 'Connection timed out. Please check network connectivity.',
    NETWORK_ERROR: 'Network error occurred. Please try again.',
    INVALID_COMMAND: 'Invalid command or parameter.',
    PERMISSION_DENIED: 'Permission denied. Check user privileges.',
    ROUTER_UNREACHABLE: 'Router is unreachable. Check IP address and connectivity.',
  };
  
  return errorMessages[error] ?? 'An unknown error occurred.';
};

/**
 * Backend Proxy Information
 * 
 * This service now uses a Go backend proxy to eliminate CORS issues.
 * 
 * Backend Setup:
 * 1. **Go Backend** (Default: http://localhost:8080)
 *    - Handles all RouterOS API communication
 *    - Eliminates CORS restrictions
 *    - Supports all RouterOS REST API endpoints
 * 
 * 2. **Environment Configuration**
 *    - Set VITE_API_BASE_URL for custom backend URL
 *    - Default: http://localhost:8080
 * 
 * 3. **Request Format**
 *    - POST /api/router/proxy
 *    - { router_ip, endpoint, method, headers, body }
 *    - Automatic HTTPS/HTTP protocol detection
 */
export const getBackendInstructions = (): string => {
  return `
Backend Proxy Configuration:

Current backend URL: ${getBackendBaseUrl()}

Environment Setup:
1. Set VITE_API_BASE_URL=http://your-backend:8080
2. Or use default localhost:8080

Go Backend Endpoints:
- POST /api/router/proxy (RouterOS API proxy)
- POST /api/scan (Start network scan)
- GET /api/scan/status?task_id=... (Check scan status)
- POST /api/scan/stop (Stop running scan)
- GET /health (Backend health check)

No CORS configuration needed!
  `.trim();
};