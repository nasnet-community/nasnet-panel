/**
 * API Client Factory
 * Creates and configures Axios instances with authentication and error handling
 */
import { AxiosInstance } from 'axios';
import type { ApiClientConfig } from './types';
/**
 * Creates a configured Axios instance with interceptors
 * Respects VITE_API_URL environment variable for dynamic configuration
 *
 * @param config Optional configuration overrides
 * @returns Configured Axios instance with interceptors registered
 */
export declare function createApiClient(config?: ApiClientConfig): AxiosInstance;
/**
 * Default API client instance
 * Used throughout the application for all API requests
 */
export declare const apiClient: AxiosInstance;
export type { ApiClientConfig };
//# sourceMappingURL=client.d.ts.map