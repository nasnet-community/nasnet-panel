import type { AuthResult, RouterCredentials } from '@shared/routeros';
import { 
  createBasicAuthHeader, 
  validateCredentials, 
  storeCredentials, 
  getStoredCredentials,
  removeStoredCredentials
} from '@/utils/basic-auth';

/**
 * Authentication service for MikroTik RouterOS REST API
 * Implements official Basic Authentication as per RouterOS documentation
 * 
 * RouterOS REST API Authentication:
 * - Uses HTTP Basic Authentication (RFC 7617)
 * - No separate authentication endpoint required
 * - Credentials sent with every request
 * - Uses same credentials as console login
 * - Default: username "admin" with empty password
 * - Supports both HTTP and HTTPS (HTTPS recommended)
 */

/** Active authentication sessions with RouterOS version info */
interface SessionData {
  credentials: RouterCredentials;
  authHeader: string;
  username: string;
  routerIp: string;
  routerOSVersion?: string;
  lastConnected: number;
  isConnected: boolean;
}

const activeSessions = new Map<string, SessionData>();

/** Temporary credentials storage for working credentials during session */
const temporaryCredentials = new Map<string, RouterCredentials>();

/**
 * Authenticate with a MikroTik router using Basic Authentication
 * Tests connection using /rest/system/identity endpoint
 * Stores credentials for subsequent requests
 */
export const authenticate = async (
  routerIp: string,
  credentials: RouterCredentials,
  saveCredentialsFlag = false
): Promise<AuthResult> => {
  try {
    // Validate credentials format
    if (!validateCredentials(credentials)) {
      return {
        success: false,
        error: 'Invalid credentials format. Username is required.'
      };
    }
    
    // Validate IP address
    if (!isValidIPAddress(routerIp)) {
      return {
        success: false,
        error: 'Invalid IP address format'
      };
    }
    
    // Create Basic Auth header
    const authHeader = createBasicAuthHeader(credentials.username, credentials.password || '');
    
    // Try HTTPS first (recommended by MikroTik), then HTTP fallback for legacy/local setups
    let authResponse = await attemptAuthentication(
      routerIp,
      authHeader,
      true // Use HTTPS first (secure)
    );
    
    if (!authResponse.success && authResponse.error?.includes('connection')) {
      // Fallback to HTTP for legacy routers or local development
      console.warn(`HTTPS authentication failed for ${routerIp}, trying HTTP fallback...`);
      authResponse = await attemptAuthentication(
        routerIp,
        authHeader,
        false // Use HTTP fallback
      );
    }
    
    if (!authResponse.success) {
      return authResponse;
    }
    
    // Store session data
    const sessionData: SessionData = {
      credentials,
      authHeader,
      username: credentials.username,
      routerIp,
      lastConnected: Date.now(),
      isConnected: true,
    };
    
    if (authResponse.routerOSVersion) {
      sessionData.routerOSVersion = authResponse.routerOSVersion;
    }
    
    activeSessions.set(routerIp, sessionData);
    
    // Save credentials if requested (permanent storage)
    if (saveCredentialsFlag) {
      storeCredentials(routerIp, credentials);
    }
    
    // Also temporarily store working credentials in memory for this session
    // This ensures subsequent requests can use them even if not permanently saved
    temporaryCredentials.set(routerIp, credentials);
    
    return {
      success: true,
      token: authHeader // Return auth header as "token" for compatibility
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
};

/**
 * Attempt authentication with RouterOS REST API using Backend Proxy
 * Uses our Go backend to bypass CORS issues
 */
const attemptAuthentication = async (
  routerIp: string,
  authHeader: string,
  useSSL: boolean
): Promise<AuthResult & { routerOSVersion?: string }> => {
  try {
    // Use backend proxy to bypass CORS issues (relative path for same-origin)
    const proxyUrl = '/api/router/proxy';
    
    const proxyRequest = {
      router_ip: routerIp,
      endpoint: '/rest/system/identity',
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for proxy
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Parse proxy response
      const proxyResponse = await response.json();
      
      // Check if the router request was successful
      if (proxyResponse.status === 200) {
        // Authentication successful
        let routerOSVersion: string | undefined;
        
        try {
          // Parse the router's response body
          const routerData = proxyResponse.body;
          if (routerData && typeof routerData === 'object') {
            // For system/identity, we don't get version, but we can try to detect it
            routerOSVersion = routerData.version || undefined;
          }
        } catch {
          // Response parsing failed, but auth was successful
        }
        
        const result: AuthResult & { routerOSVersion?: string } = {
          success: true,
          token: authHeader,
        };
        
        if (routerOSVersion) {
          result.routerOSVersion = routerOSVersion;
        }
        
        return result;
      } else if (proxyResponse.status === 401) {
        return {
          success: false,
          error: 'Invalid username or password. Try default credentials: username "admin" with empty password, or check if custom credentials were set.',
        };
      } else if (proxyResponse.status === 403) {
        return {
          success: false,
          error: 'Access denied. Check user permissions',
        };
      } else if (proxyResponse.status === 404) {
        return {
          success: false,
          error: 'REST API not available. RouterOS v7.1+ required',
        };
      } else {
        return {
          success: false,
          error: `Authentication failed: Router returned HTTP ${proxyResponse.status}`,
        };
      }
    } else {
      return {
        success: false,
        error: `Proxy error: HTTP ${response.status}`,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timeout. Router may be unreachable',
        };
      } else if (error.message.includes('CORS')) {
        return {
          success: false,
          error: 'CORS error. Configure CORS proxy or use RouterOS API directly',
        };
      } else if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error. Check router connectivity',
        };
      }
    }
    
    return {
      success: false,
      error: 'Authentication failed. Check network and router configuration',
    };
  }
};

/**
 * Logout from a router session
 * Removes stored session data and optionally stored credentials
 */
export const logout = async (routerIp: string, removeStoredCreds = false): Promise<boolean> => {
  try {
    const session = activeSessions.get(routerIp);
    
    if (session) {
      // Mark session as disconnected
      session.isConnected = false;
      
      // Remove session data
      activeSessions.delete(routerIp);
      
      // Remove stored credentials if requested
      if (removeStoredCreds) {
        removeStoredCredentials(routerIp);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

/**
 * Check if there's an active session for a router
 * Basic Auth doesn't expire, but we track connection status
 */
export const isAuthenticated = (routerIp: string): boolean => {
  const session = activeSessions.get(routerIp);
  
  if (!session) {
    return false;
  }
  
  // Basic Auth sessions don't expire, but we can check connection status
  return session.isConnected;
};

/**
 * Get the Basic Auth header for a router
 * Returns the Authorization header value
 */
export const getAuthHeader = (routerIp: string): string | null => {
  const session = activeSessions.get(routerIp);
  
  if (!session || !session.isConnected) {
    return null;
  }
  
  return session.authHeader;
};

/**
 * Get the session token for a router (compatibility method)
 * Returns the Basic Auth header for backward compatibility
 */
export const getSessionToken = (routerIp: string): string | null => {
  return getAuthHeader(routerIp);
};

/**
 * Get session data for a router
 */
export const getSessionData = (routerIp: string): SessionData | null => {
  return activeSessions.get(routerIp) || null;
};

/**
 * Get RouterOS version for authenticated router
 */
export const getRouterOSVersion = (routerIp: string): string | null => {
  const session = activeSessions.get(routerIp);
  return session?.routerOSVersion || null;
};

/**
 * Test connection to router using stored credentials
 * This validates the Basic Auth credentials are still working
 */
export const testConnection = async (routerIp: string): Promise<AuthResult> => {
  try {
    const session = activeSessions.get(routerIp);
    
    if (!session) {
      return {
        success: false,
        error: 'No active session found'
      };
    }
    
    // Test connection using stored auth header (HTTPS first for security)
    const authResponse = await attemptAuthentication(
      routerIp,
      session.authHeader,
      true // Try HTTPS first (secure)
    );
    
    if (!authResponse.success) {
      // Try HTTP fallback for legacy/local setups
      const httpResponse = await attemptAuthentication(
        routerIp,
        session.authHeader,
        false
      );
      
      if (httpResponse.success) {
        // Update session with connection status
        session.isConnected = true;
        session.lastConnected = Date.now();
        return { success: true };
      }
      
      // Connection failed, mark as disconnected
      session.isConnected = false;
      return authResponse;
    }
    
    // Connection successful
    session.isConnected = true;
    session.lastConnected = Date.now();
    
    return { success: true };
  } catch (error) {
    console.error('Connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
};

/**
 * Restore session using stored credentials
 */
export const restoreSession = async (routerIp: string): Promise<AuthResult> => {
  const storedCredentials = getStoredCredentials(routerIp);
  
  if (!storedCredentials) {
    return {
      success: false,
      error: 'No stored credentials found'
    };
  }
  
  return authenticate(routerIp, storedCredentials, false);
};

/**
 * Refresh connection status for existing session
 * Basic Auth doesn't need token refresh, but we can test connectivity
 */
export const refreshSession = async (routerIp: string): Promise<AuthResult> => {
  const session = activeSessions.get(routerIp);
  
  if (!session) {
    return {
      success: false,
      error: 'No active session found'
    };
  }
  
  // Test current connection
  return testConnection(routerIp);
};

/**
 * Clear all active sessions
 */
export const clearAllSessions = (): void => {
  activeSessions.clear();
};

/**
 * Get all active session IPs
 */
export const getActiveSessionIps = (): readonly string[] => {
  const activeIps: string[] = [];
  
  for (const [ip, session] of activeSessions.entries()) {
    if (session.isConnected) {
      activeIps.push(ip);
    }
  }
  
  return activeIps;
};

/**
 * Test basic connectivity to a router (without authentication)
 */
export const testBasicConnectivity = async (routerIp: string, timeout = 5000): Promise<boolean> => {
  try {
    if (!isValidIPAddress(routerIp)) {
      return false;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Try to connect to RouterOS REST API ports
    const ports = [443, 80]; // Focus on REST API ports
    
    for (const port of ports) {
      try {
        const protocol = port === 443 ? 'https' : 'http';
        const url = `${protocol}://${routerIp}:${port}/rest/system/identity`;
        
        // Use backend proxy for RouterOS REST API endpoints (relative path for same-origin)
        const proxyUrl = '/api/router/proxy';
        const proxyRequest = {
          router_ip: routerIp,
          endpoint: '/rest/system/identity',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic YWRtaW46', // admin with empty password (default MikroTik)
          }
        };
        
        await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proxyRequest),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return true; // Connection successful
      } catch {
        // Continue to next port
      }
    }
    
    clearTimeout(timeoutId);
    return false;
  } catch (error) {
    console.debug(`Basic connectivity test failed for ${routerIp}:`, error);
    return false;
  }
};


/**
 * Validate IP address format
 */
const isValidIPAddress = (ip: string): boolean => {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  // Check each octet
  const octets = ip.split('.');
  for (const octet of octets) {
    const num = parseInt(octet, 10);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get authentication status for all routers
 */
export const getAuthenticationStatus = (): Record<string, {
  authenticated: boolean;
  username?: string;
  routerOSVersion?: string;
  lastConnected?: number;
  isConnected?: boolean;
}> => {
  const status: Record<string, any> = {};
  
  for (const [ip, session] of activeSessions.entries()) {
    status[ip] = {
      authenticated: session.isConnected,
      username: session.username,
      routerOSVersion: session.routerOSVersion,
      lastConnected: session.lastConnected,
      isConnected: session.isConnected,
    };
  }
  
  return status;
};

/**
 * Test multiple common credential combinations for a router
 */
export const testCommonCredentials = async (routerIp: string): Promise<{
  success: boolean;
  workingCredentials?: RouterCredentials;
  testedCredentials: Array<{ credentials: RouterCredentials; result: AuthResult }>;
}> => {
  const commonCredentials = [
    { username: 'admin', password: '' },           // Default MikroTik
    { username: 'admin', password: 'admin' },      // Common setup
    { username: 'admin', password: 'password' },   // Common setup
    { username: 'administrator', password: '' },    // Alternative admin
    { username: 'mikrotik', password: 'mikrotik' }, // Custom setup
  ];
  
  const testedCredentials: Array<{ credentials: RouterCredentials; result: AuthResult }> = [];
  
  for (const credentials of commonCredentials) {
    const result = await authenticate(routerIp, credentials, false);
    testedCredentials.push({ credentials, result });
    
    if (result.success) {
      return {
        success: true,
        workingCredentials: credentials,
        testedCredentials
      };
    }
  }
  
  return {
    success: false,
    testedCredentials
  };
};

/**
 * Batch authenticate multiple routers
 */
export const batchAuthenticate = async (
  routers: Array<{ ip: string; credentials: RouterCredentials }>
): Promise<Record<string, AuthResult>> => {
  const results: Record<string, AuthResult> = {};
  
  // Authenticate in parallel with concurrency limit
  const maxConcurrent = 5;
  const chunks: typeof routers[] = [];
  
  for (let i = 0; i < routers.length; i += maxConcurrent) {
    chunks.push(routers.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async ({ ip, credentials }) => {
      const result = await authenticate(ip, credentials);
      results[ip] = result;
    });
    
    await Promise.allSettled(promises);
  }
  
  return results;
};

/**
 * Get authentication header for router requests
 * Returns active session auth header or creates one with default credentials
 */
export const getAuthHeaderForRouter = (routerIp: string, fallbackCredentials?: RouterCredentials): string | null => {
  // First try to get existing auth header from active session
  const sessionAuthHeader = getAuthHeader(routerIp);
  
  if (sessionAuthHeader) {
    return sessionAuthHeader;
  }
  
  // If no active session, try fallback credentials
  if (fallbackCredentials) {
    return createBasicAuthHeader(fallbackCredentials.username, fallbackCredentials.password || '');
  }
  
  // Check for stored credentials for this router (permanent storage)
  const storedCredentials = getStoredCredentials(routerIp);
  if (storedCredentials) {
    console.log(`Using stored credentials for router ${routerIp}`);
    return createBasicAuthHeader(storedCredentials.username, storedCredentials.password || '');
  }
  
  // Check for temporary credentials for this router (session storage)
  const tempCredentials = temporaryCredentials.get(routerIp);
  if (tempCredentials) {
    console.log(`Using temporary credentials for router ${routerIp}`);
    return createBasicAuthHeader(tempCredentials.username, tempCredentials.password || '');
  }
  
  // Default fallback: admin with empty password (MikroTik default)
  console.log(`Using default credentials for router ${routerIp}`);
  return createBasicAuthHeader('admin', '');
};

/**
 * Helper function to get proxy request with authentication
 */
export const createAuthenticatedProxyRequest = (
  routerIp: string, 
  endpoint: string, 
  method: string = 'GET',
  body?: any,
  fallbackCredentials?: RouterCredentials
) => {
  const authHeader = getAuthHeaderForRouter(routerIp, fallbackCredentials);
  
  if (!authHeader) {
    throw new Error('No authentication available for router');
  }
  
  return {
    router_ip: routerIp,
    endpoint: endpoint,
    method: method,
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body && { body })
  };
};