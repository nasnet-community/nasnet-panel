/**
 * Authentication Interceptor
 * Implements HTTP Basic Auth for API requests
 */
import type { InternalAxiosRequestConfig } from 'axios';
import type { StoredCredentials } from '../types';
/**
 * Stores credentials in localStorage
 * @param credentials Username and password to store
 */
export declare function storeCredentials(credentials: StoredCredentials): void;
/**
 * Clears stored credentials
 */
export declare function clearCredentials(): void;
/**
 * Auth request interceptor
 * Adds HTTP Basic Auth header if credentials are available
 * Uses Base64 encoding as per HTTP Basic Auth specification
 *
 * @param config Axios request config
 * @returns Modified config with Authorization header
 */
export declare function authInterceptor(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig;
//# sourceMappingURL=auth.d.ts.map
