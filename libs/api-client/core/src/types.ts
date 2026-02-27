/**
 * API Response Types
 * Defines the structure of API responses from rosproxy backend
 */

/**
 * Success response format
 * @template T The type of data being returned
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

/**
 * Error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * API Error class for type-safe error handling
 */
export class ApiError extends Error {
  public originalError?: unknown;
  public statusCode?: number;
  public code?: string;

  constructor(message: string, originalError?: unknown, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Credentials interface for storage
 */
export interface StoredCredentials {
  username: string;
  password: string;
}

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Extended Axios config for retry tracking
 */
export interface RetryConfig {
  retryCount?: number;
  [key: string]: unknown;
}
