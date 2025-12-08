/**
 * Router Proxy Client
 * Sends RouterOS REST API requests through rosproxy backend
 * Similar to connectpoc architecture to bypass CORS issues in development
 */

import type { StoredCredentials } from './types';

const CREDENTIALS_STORAGE_KEY = 'nasnet:api:credentials';

/** Backend proxy configuration */
interface ProxyConfig {
  readonly timeout: number;
  readonly retries: number;
  readonly retryDelay: number;
  readonly baseUrl: string;
}

/** Backend proxy request format */
interface RouterProxyRequest {
  router_ip: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

/** Backend proxy response format */
interface RouterProxyResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Request options for RouterOS API calls */
export interface RouterOSRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/** Response wrapper for RouterOS API calls */
export interface RouterOSResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

const defaultConfig: ProxyConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  baseUrl: '',
};

/**
 * Get stored credentials from localStorage
 */
function getStoredCredentials(): StoredCredentials | null {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.username && parsed.password) {
      return parsed;
    }
  } catch {
    console.debug('[RouterProxy] Failed to retrieve stored credentials');
  }
  return null;
}

/**
 * Build Authorization header from stored credentials
 */
function getAuthHeader(): string | null {
  const credentials = getStoredCredentials();
  if (!credentials) return null;
  const encoded = btoa(`${credentials.username}:${credentials.password}`);
  return `Basic ${encoded}`;
}

/**
 * Build RouterOS REST API endpoint path
 * Ensures endpoint starts with /rest/
 */
function buildRouterOSEndpoint(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // If already starts with 'rest/', add leading slash
  if (cleanEndpoint.startsWith('rest/')) {
    return `/${cleanEndpoint}`;
  }
  
  // Add /rest/ prefix
  return `/rest/${cleanEndpoint}`;
}

/**
 * Convert RouterOS field names from kebab-case to camelCase
 */
function convertRouterOSResponse<T>(data: unknown): T {
  if (Array.isArray(data)) {
    return data.map(item => convertRouterOSResponse(item)) as T;
  }
  
  if (data && typeof data === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = convertRouterOSResponse(value);
    }
    return converted as T;
  }
  
  return data as T;
}

/**
 * Makes an authenticated REST API request to a RouterOS device via backend proxy
 * 
 * @param routerIp - Target router IP address
 * @param endpoint - RouterOS REST API endpoint (e.g., 'system/resource', 'interface')
 * @param options - Request options (method, body, headers)
 * @param config - Optional proxy configuration overrides
 * @returns Promise with response data or error
 * 
 * @example
 * ```typescript
 * // Get system resource info
 * const result = await makeRouterOSRequest('192.168.88.1', 'system/resource');
 * 
 * // POST with body
 * const result = await makeRouterOSRequest('192.168.88.1', 'interface/set', {
 *   method: 'POST',
 *   body: { '.id': '*1', disabled: 'false' }
 * });
 * ```
 */
export async function makeRouterOSRequest<T>(
  routerIp: string,
  endpoint: string,
  options: RouterOSRequestOptions = {},
  config: Partial<ProxyConfig> = {}
): Promise<RouterOSResponse<T>> {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Get auth header
  const authHeader = getAuthHeader();
  if (!authHeader) {
    return {
      success: false,
      error: 'No valid authentication credentials found',
      timestamp: Date.now(),
    };
  }
  
  let lastError = 'Unknown error occurred';
  
  for (let attempt = 0; attempt < finalConfig.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
      
      // Build proxy request
      const proxyRequest: RouterProxyRequest = {
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
      
      // Add body if present and not GET
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
      const proxyResponse: RouterProxyResponse = await response.json();
      
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
}

/**
 * Create a query function for TanStack Query that uses the router proxy
 * 
 * @param routerIp - Target router IP address
 * @param endpoint - RouterOS REST API endpoint
 * @returns Query function that returns the data or throws on error
 * 
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: ['interfaces', routerIp],
 *   queryFn: createProxyQueryFn<Interface[]>(routerIp, 'interface'),
 * });
 * ```
 */
export function createProxyQueryFn<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions
): () => Promise<T> {
  return async () => {
    const result = await makeRouterOSRequest<T>(routerIp, endpoint, options);
    
    if (!result.success) {
      throw new Error(result.error || 'Request failed');
    }
    
    return result.data as T;
  };
}

/**
 * Create a mutation function for TanStack Query that uses the router proxy
 * 
 * @param routerIp - Target router IP address
 * @param endpoint - RouterOS REST API endpoint
 * @param method - HTTP method for the mutation
 * @returns Mutation function
 */
export function createProxyMutationFn<TData, TVariables>(
  routerIp: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
): (variables: TVariables) => Promise<TData> {
  return async (variables: TVariables) => {
    const result = await makeRouterOSRequest<TData>(routerIp, endpoint, {
      method,
      body: variables,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Mutation failed');
    }
    
    return result.data as TData;
  };
}








