/**
 * Router Proxy Client
 * Sends RouterOS REST API requests through rosproxy backend
 * Similar to connectpoc architecture to bypass CORS issues in development
 */
/** Backend proxy configuration */
interface ProxyConfig {
  readonly timeout: number;
  readonly retries: number;
  readonly retryDelay: number;
  readonly baseUrl: string;
}
/** Request options for RouterOS API calls */
export interface RouterOSRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}
/** Response wrapper for RouterOS API calls */
export interface RouterOSResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
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
export declare function makeRouterOSRequest<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions,
  config?: Partial<ProxyConfig>
): Promise<RouterOSResponse<T>>;
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
export declare function createProxyQueryFn<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions
): () => Promise<T>;
/**
 * Create a mutation function for TanStack Query that uses the router proxy
 *
 * @param routerIp - Target router IP address
 * @param endpoint - RouterOS REST API endpoint
 * @param method - HTTP method for the mutation
 * @returns Mutation function
 */
export declare function createProxyMutationFn<TData, TVariables>(
  routerIp: string,
  endpoint: string,
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): (variables: TVariables) => Promise<TData>;
export {};
//# sourceMappingURL=router-proxy.d.ts.map
