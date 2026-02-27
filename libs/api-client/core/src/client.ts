/// <reference types="vite/client" />

/**
 * API Client Factory
 * Creates and configures Axios instances with authentication and error handling
 */

import axios, { AxiosInstance } from 'axios';
import { authInterceptor } from './interceptors/auth';
import { errorInterceptor } from './interceptors/error';
import { retryInterceptor } from './interceptors/retry';
import type { ApiClientConfig } from './types';

/**
 * Creates a configured Axios instance with interceptors
 * Respects VITE_API_URL environment variable for dynamic configuration
 *
 * @param config Optional configuration overrides
 * @returns Configured Axios instance with interceptors registered
 */
export function createApiClient(config?: ApiClientConfig): AxiosInstance {
  // Determine base URL: config > environment variable > default
  const baseURL =
    config?.baseURL || (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';

  // Create Axios instance
  const client = axios.create({
    baseURL,
    timeout: config?.timeout ?? 30000,
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
  });

  // Register interceptors in order:
  // 1. Auth interceptor (adds credentials)
  client.interceptors.request.use(authInterceptor);

  // Response interceptors (error handlers - order matters for LIFO execution)
  // Interceptors execute in REVERSE registration order (LIFO stack):
  // 2. Register retry interceptor FIRST → executes SECOND in error chain
  // 3. Register error interceptor SECOND → executes FIRST in error chain
  // This ensures: AxiosError → retry logic → user-friendly ApiError
  client.interceptors.response.use((response) => response, retryInterceptor);

  // Error interceptor transforms final rejections to user-friendly messages
  client.interceptors.response.use((response) => response, errorInterceptor);

  return client;
}

/**
 * Default API client instance
 * Used throughout the application for all API requests
 */
export const apiClient = createApiClient();

export type { ApiClientConfig };
