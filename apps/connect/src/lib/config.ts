/**
 * Application Configuration Module
 * Provides typed configuration from environment variables
 *
 * Environment Variables (all prefixed with VITE_ for client-side access):
 * - VITE_API_URL: Base URL for API requests (empty = same-origin)
 * - VITE_WS_URL: WebSocket URL (empty = same-origin)
 * - VITE_APP_VERSION: Application version (optional)
 *
 * @example
 * ```typescript
 * import { config, getApiUrl, getWsUrl } from '@/lib/config';
 *
 * console.log(config.apiBaseUrl); // '' (same-origin) or 'http://localhost:8080'
 * console.log(config.isDevelopment); // true if DEV mode
 * ```
 */

export interface AppConfig {
  /** Base URL for API requests. Empty string = same-origin (production default) */
  readonly apiBaseUrl: string;
  /** WebSocket URL for real-time updates. Empty string = same-origin */
  readonly wsBaseUrl: string;
  /** Application version from env or default */
  readonly version: string;
  /** True if running in development mode */
  readonly isDevelopment: boolean;
  /** True if running in production mode */
  readonly isProduction: boolean;
}

/**
 * Application configuration singleton
 * Reads from Vite environment variables at build time
 */
export const config: AppConfig = {
  // API URLs - empty string means same-origin (default for Docker deployment)
  apiBaseUrl: import.meta.env.VITE_API_URL || '',
  wsBaseUrl: import.meta.env.VITE_WS_URL || '',

  // Application metadata
  version: import.meta.env.VITE_APP_VERSION || '0.1.0',

  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

/**
 * Get the configured API base URL
 * @returns API base URL or empty string for same-origin
 */
export function getApiUrl(): string {
  return config.apiBaseUrl;
}

/**
 * Get the configured WebSocket URL
 * @returns WebSocket URL or empty string for same-origin
 */
export function getWsUrl(): string {
  return config.wsBaseUrl;
}

/**
 * Build a full API endpoint URL
 * @param endpoint - Relative endpoint path (e.g., '/api/router/proxy')
 * @returns Full URL combining base URL and endpoint
 */
export function buildApiEndpoint(endpoint: string): string {
  if (!config.apiBaseUrl) {
    // Same-origin: return relative path
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  // Custom base URL: combine with endpoint
  const base = config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl.slice(0, -1) : config.apiBaseUrl;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Build a full WebSocket URL
 * @param path - Relative WebSocket path (e.g., '/ws')
 * @returns Full WebSocket URL
 */
export function buildWsEndpoint(path: string): string {
  if (!config.wsBaseUrl) {
    // Same-origin: derive WebSocket URL from current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${window.location.host}${wsPath}`;
  }
  // Custom base URL: combine with path
  const base = config.wsBaseUrl.endsWith('/') ? config.wsBaseUrl.slice(0, -1) : config.wsBaseUrl;
  const wsPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${wsPath}`;
}

export default config;
