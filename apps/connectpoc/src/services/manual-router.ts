import { authenticate, testBasicConnectivity, getRouterOSVersion, testCommonCredentials } from '@/services/auth';
import { 
  addManualRouterToStorage, 
  removeManualRouterFromStorage,
  getStoredManualRouters,
  getManualRouterFromStorage 
} from '@/utils/storage';

import type { RouterInfo, RouterCredentials, AuthResult, ScanResult } from '@shared/routeros';

/**
 * Service for managing manually added routers
 * Handles connection testing, validation, and storage of manual router entries
 */

export interface ManualRouterEntry {
  readonly ip: string;
  readonly name: string;
  readonly credentials: RouterCredentials;
  readonly addedManually: true;
  readonly dateAdded: number;
}

export interface ManualConnectionResult {
  readonly success: boolean;
  readonly routerInfo?: RouterInfo;
  readonly error?: string;
  readonly routerOSVersion?: string;
}


/**
 * Test connection to a manually entered router
 * Validates IP format, tests basic connectivity, then attempts authentication
 */
export const testManualConnection = async (
  ip: string,
  credentials: RouterCredentials,
  timeoutMs = 10000
): Promise<ManualConnectionResult> => {
  try {
    // Validate IP address format
    if (!isValidIPAddress(ip)) {
      return {
        success: false,
        error: 'Invalid IP address format. Please enter a valid IPv4 address (e.g., 192.168.1.1)'
      };
    }

    // Validate credentials
    if (!credentials.username || credentials.username.trim() === '') {
      return {
        success: false,
        error: 'Username is required. Default username is usually "admin"'
      };
    }

    // Test basic connectivity first
    console.log(`Testing basic connectivity to ${ip}...`);
    const isReachable = await testBasicConnectivity(ip, timeoutMs / 2);
    
    if (!isReachable) {
      return {
        success: false,
        error: `Router at ${ip} is not reachable. Check IP address and network connectivity.`
      };
    }

    // Attempt authentication
    console.log(`Testing authentication for ${ip}...`);
    const authResult = await authenticate(ip, credentials, false);
    
    if (!authResult.success) {
      let errorMessage = authResult.error || 'Authentication failed';
      
      // Provide more specific error guidance
      if (errorMessage.includes('Invalid username or password')) {
        errorMessage = 'Invalid username or password. Default credentials are usually username "admin" with empty password.';
      } else if (errorMessage.includes('REST API not available')) {
        errorMessage = 'REST API not available. RouterOS version 7.1 or higher is required for this application.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timeout. Router may be busy or have slow response times.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error. Try accessing the router directly or configure CORS proxy.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Get RouterOS version
    const routerOSVersion = getRouterOSVersion(ip);

    // Create router info
    const routerInfo: RouterInfo = {
      id: `manual-${ip}`,
      name: `Manual Router ${ip}`,
      ip: ip,
      status: 'online',
      ...(routerOSVersion && { version: routerOSVersion })
    };

    return {
      success: true,
      routerInfo,
      routerOSVersion: routerOSVersion || undefined
    };

  } catch (error) {
    console.error('Manual connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during connection test'
    };
  }
};

/**
 * Add a manually entered router after successful connection test
 * Stores the router configuration for future use
 */
export const addManualRouter = async (
  ip: string,
  credentials: RouterCredentials,
  customName?: string,
  saveCredentials = false
): Promise<ManualConnectionResult> => {
  try {
    // First test the connection
    const connectionResult = await testManualConnection(ip, credentials);
    
    if (!connectionResult.success || !connectionResult.routerInfo) {
      return connectionResult;
    }

    // Create manual router entry
    const manualEntry: ManualRouterEntry = {
      ip: ip,
      name: customName || `Router ${ip}`,
      credentials: credentials,
      addedManually: true,
      dateAdded: Date.now()
    };

    // Save to storage if requested
    if (saveCredentials) {
      const success = addManualRouterToStorage(manualEntry);
      if (!success) {
        console.warn('Failed to save manual router to storage');
      }
    }

    // Update router info with custom name
    const updatedRouterInfo: RouterInfo = {
      ...connectionResult.routerInfo,
      name: manualEntry.name
    };

    return {
      success: true,
      routerInfo: updatedRouterInfo,
      routerOSVersion: connectionResult.routerOSVersion
    };

  } catch (error) {
    console.error('Add manual router error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add manual router'
    };
  }
};

/**
 * Load manually added routers from storage
 */
export const loadManualRouters = (): ManualRouterEntry[] => {
  return getStoredManualRouters();
};

/**
 * Remove a manually added router
 */
export const removeManualRouter = async (ip: string): Promise<boolean> => {
  return removeManualRouterFromStorage(ip);
};

/**
 * Get manual router entry by IP
 */
export const getManualRouter = (ip: string): ManualRouterEntry | null => {
  return getManualRouterFromStorage(ip);
};

/**
 * Convert manual router entry to ScanResult for compatibility
 */
export const manualRouterToScanResult = (entry: ManualRouterEntry, routerOSVersion?: string): ScanResult => {
  return {
    ip: entry.ip,
    hostname: entry.name,
    services: [
      { port: 80, protocol: 'tcp', service: 'mikrotik-rest' },
      { port: 443, protocol: 'tcp', service: 'mikrotik-rest-ssl' }
    ],
    responseTime: 0, // Not applicable for manual entries
    ...(routerOSVersion && { version: routerOSVersion })
  };
};

/**
 * Batch test multiple manual router connections
 */
export const batchTestManualConnections = async (
  routers: Array<{ ip: string; credentials: RouterCredentials }>
): Promise<Record<string, ManualConnectionResult>> => {
  const results: Record<string, ManualConnectionResult> = {};
  
  // Test connections in parallel with concurrency limit
  const maxConcurrent = 3; // Lower than auth service to be conservative
  const chunks: typeof routers[] = [];
  
  for (let i = 0; i < routers.length; i += maxConcurrent) {
    chunks.push(routers.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async ({ ip, credentials }) => {
      const result = await testManualConnection(ip, credentials);
      results[ip] = result;
    });
    
    await Promise.allSettled(promises);
  }
  
  return results;
};

/**
 * Validate IPv4 address format
 */
const isValidIPAddress = (ip: string): boolean => {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  // Check each octet is in valid range (0-255)
  const octets = ip.split('.');
  for (const octet of octets) {
    const num = parseInt(octet, 10);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  
  // Reject obviously invalid IPs
  if (ip === '0.0.0.0' || ip === '255.255.255.255') {
    return false;
  }
  
  return true;
};

/**
 * Test connection with automatic credential detection
 */
export const testConnectionWithAutoCredentials = async (ip: string): Promise<ManualConnectionResult> => {
  try {
    // First test basic connectivity
    console.log(`Testing basic connectivity to ${ip}...`);
    const isReachable = await testBasicConnectivity(ip, 5000);
    
    if (!isReachable) {
      return {
        success: false,
        error: `Router at ${ip} is not reachable. Check IP address and network connectivity.`
      };
    }

    // Try common credential combinations
    console.log(`Testing common credentials for ${ip}...`);
    const credentialTest = await testCommonCredentials(ip);
    
    if (credentialTest.success && credentialTest.workingCredentials) {
      // Get RouterOS version
      const routerOSVersion = getRouterOSVersion(ip);

      // Create router info
      const routerInfo: RouterInfo = {
        id: `manual-${ip}`,
        name: `Manual Router ${ip}`,
        ip: ip,
        status: 'online',
        ...(routerOSVersion && { version: routerOSVersion })
      };

      return {
        success: true,
        routerInfo,
        routerOSVersion: routerOSVersion || undefined
      };
    } else {
      // Provide detailed error information
      const errorDetails = credentialTest.testedCredentials
        .map(({ credentials, result }) => 
          `${credentials.username}:${credentials.password || '(empty)'} - ${result.error || 'Unknown error'}`
        )
        .join('\n');
      
      return {
        success: false,
        error: `Authentication failed with all common credentials. Tested:\n${errorDetails}`
      };
    }
  } catch (error) {
    console.error('Auto-credential test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test credentials automatically'
    };
  }
};

/**
 * Get connection validation suggestions based on IP address
 */
export const getConnectionSuggestions = (ip: string): string[] => {
  const suggestions: string[] = [];
  
  if (!isValidIPAddress(ip)) {
    suggestions.push('Enter a valid IPv4 address (e.g., 192.168.1.1)');
    return suggestions;
  }
  
  const octets = ip.split('.').map(Number);
  
  // Common MikroTik default IPs
  if (ip === '192.168.88.1') {
    suggestions.push('This looks like a default MikroTik router IP');
    suggestions.push('Default credentials: username "admin", password empty');
  }
  
  // Private network ranges
  if (
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 10) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  ) {
    suggestions.push('Private IP address - ensure you\'re on the same network');
  } else {
    suggestions.push('Public IP address - check firewall and network accessibility');
  }
  
  suggestions.push('Try default username "admin" with empty password');
  suggestions.push('Ensure RouterOS version 7.1+ for REST API support');
  suggestions.push('Use "Test Auto-Credentials" to try common combinations automatically');
  
  return suggestions;
};