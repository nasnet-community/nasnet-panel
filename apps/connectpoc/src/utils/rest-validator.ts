/**
 * MikroTik RouterOS REST API validation utilities
 * Based on official REST API documentation for RouterOS v7.1beta4+
 */

import type { RouterCredentials } from '@shared/routeros';
import { getAuthHeaderForRouter, createAuthenticatedProxyRequest } from '@/services/auth';

/**
 * REST API response structure from RouterOS
 */
export interface RouterOSRestResponse {
  [key: string]: any;
  error?: number;
  message?: string;
}

/**
 * Validates if a response is from a valid MikroTik REST API endpoint
 * Checks for JSON format and RouterOS-specific response patterns
 */
export const isValidRestApiResponse = (response: Response): boolean => {
  // Check if response is successful (2xx status codes)
  if (!response.ok || response.status < 200 || response.status >= 300) {
    return false;
  }

  // Check for JSON content type
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return false;
  }

  return true;
};

/**
 * Validates the JSON structure of a RouterOS REST API response
 * RouterOS REST API always returns JSON objects (not arrays at root level)
 */
export const isValidRouterOSJson = (data: any): boolean => {
  // Must be an object (RouterOS doesn't return arrays at root)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }

  // Check for error responses (RouterOS error format)
  if ('error' in data && 'message' in data) {
    // This is a valid error response from RouterOS
    return true;
  }

  // Valid data response - should have at least one property
  return Object.keys(data).length > 0;
};

/**
 * Extracts RouterOS version from REST API response if available
 * Returns null if version cannot be determined
 */
export const extractRouterOSVersion = (data: any): string | null => {
  // Check common version fields in various RouterOS responses
  if (data?.version) {
    return data.version;
  }
  
  if (data?.['version-string']) {
    return data['version-string'];
  }
  
  if (data?.system?.version) {
    return data.system.version;
  }

  // Try to extract from resource information
  if (data?.['platform'] && data?.['version']) {
    return `${data.platform} ${data.version}`;
  }

  return null;
};

/**
 * Tests if a URL is a valid MikroTik REST API endpoint
 * Performs a lightweight test with optional authentication
 */
export const testRestEndpoint = async (
  ip: string,
  protocol: 'http' | 'https' = 'http',
  username: string = 'admin',
  password: string = '',
  timeout: number = 2000
): Promise<{
  valid: boolean;
  version?: string;
  responseTime?: number;
  error?: string;
}> => {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Use fallback credentials for REST validation
    const fallbackCredentials: RouterCredentials = { username, password };
    
    // Create authenticated proxy request using centralized auth
    const proxyRequest = createAuthenticatedProxyRequest(
      ip,
      '/rest',
      'GET',
      undefined,
      fallbackCredentials
    );
    
    const response = await fetch('http://localhost:8080/api/router/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    // Handle proxy response
    if (!response.ok) {
      return {
        valid: false,
        responseTime,
        error: `Proxy error: ${response.status} ${response.statusText}`,
      };
    }

    // Try to parse proxy response
    try {
      const proxyResponse = await response.json();
      
      // Check RouterOS response status from proxy
      if (proxyResponse.status < 200 || proxyResponse.status >= 300) {
        return {
          valid: false,
          responseTime,
          error: `RouterOS error: ${proxyResponse.status} ${proxyResponse.status_text || ''}`,
        };
      }
      
      const data = proxyResponse.body;
      
      if (!isValidRouterOSJson(data)) {
        return {
          valid: false,
          responseTime,
          error: 'Invalid RouterOS JSON structure',
        };
      }

      // Extract version if available
      const version = extractRouterOSVersion(data);
      
      const result: { valid: boolean; version?: string; responseTime?: number; error?: string; } = {
        valid: true,
        responseTime,
      };
      
      if (version) {
        result.version = version;
      }
      
      return result;
    } catch (jsonError) {
      return {
        valid: false,
        responseTime,
        error: 'Failed to parse JSON response',
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          valid: false,
          error: 'Request timeout',
        };
      }
      return {
        valid: false,
        error: error.message,
      };
    }
    
    return {
      valid: false,
      error: 'Unknown error occurred',
    };
  }
};

/**
 * Common MikroTik default IPs to prioritize in scanning
 */
export const COMMON_MIKROTIK_IPS = [
  '192.168.88.1',    // Default MikroTik IP
  '192.168.1.1',     // Common router IP
  '192.168.0.1',     // Common router IP
  '192.168.1.254',   // Common gateway
  '192.168.0.254',   // Common gateway
  '10.0.0.1',        // Common private network
  '10.0.0.254',      // Common private network
  '172.16.0.1',      // Common private network
  '172.16.0.254',    // Common private network
] as const;

/**
 * Checks if an IP is a common MikroTik default
 */
export const isCommonMikroTikIp = (ip: string): boolean => {
  return COMMON_MIKROTIK_IPS.includes(ip as any);
};

/**
 * Generates a prioritized list of IPs with common MikroTik IPs first
 */
export const prioritizeMikroTikIps = (ips: readonly string[]): string[] => {
  const commonIps = ips.filter(ip => isCommonMikroTikIp(ip));
  const otherIps = ips.filter(ip => !isCommonMikroTikIp(ip));
  
  return [...commonIps, ...otherIps];
};

/**
 * REST API authentication test result
 */
export interface AuthTestResult {
  authenticated: boolean;
  username?: string;
  error?: string;
}

/**
 * Tests authentication against RouterOS REST API
 */
export const testAuthentication = async (
  ip: string,
  username: string,
  password: string,
  protocol: 'http' | 'https' = 'http',
  timeout: number = 2000
): Promise<AuthTestResult> => {
  try {
    const result = await testRestEndpoint(ip, protocol, username, password, timeout);
    
    if (result.valid) {
      return {
        authenticated: true,
        username,
      };
    }
    
    // Check if it's an authentication error
    if (result.error?.includes('401') || result.error?.includes('Unauthorized')) {
      return {
        authenticated: false,
        error: 'Invalid credentials',
      };
    }
    
    return {
      authenticated: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};