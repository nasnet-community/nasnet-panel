/**
 * Authentication Interceptor
 * Implements HTTP Basic Auth for API requests
 */

import type { InternalAxiosRequestConfig } from 'axios';
import type { StoredCredentials } from '../types';

const CREDENTIALS_STORAGE_KEY = 'nasnet:api:credentials';

/**
 * Retrieves stored credentials from localStorage
 * @returns Credentials or null if not found/invalid
 */
function getStoredCredentials(): StoredCredentials | null {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.username && parsed.password) {
      return parsed;
    }
  } catch (e) {
    // Log silently, credentials are optional
    console.debug('[API Auth] Failed to retrieve stored credentials');
  }
  return null;
}

/**
 * Stores credentials in localStorage
 * @param credentials Username and password to store
 */
export function storeCredentials(credentials: StoredCredentials): void {
  try {
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.error('[API Auth] Failed to store credentials', e);
    throw new Error('Failed to store credentials');
  }
}

/**
 * Clears stored credentials
 */
export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  } catch (e) {
    console.error('[API Auth] Failed to clear credentials', e);
  }
}

/**
 * Auth request interceptor
 * Adds HTTP Basic Auth header if credentials are available
 * Uses Base64 encoding as per HTTP Basic Auth specification
 *
 * @param config Axios request config
 * @returns Modified config with Authorization header
 */
export function authInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const credentials = getStoredCredentials();

  if (credentials && credentials.username && credentials.password) {
    // Encode credentials as Base64: "username:password" -> base64
    const encoded = btoa(`${credentials.username}:${credentials.password}`);

    // Set Authorization header with Basic scheme
    config.headers.Authorization = `Basic ${encoded}`;
  }

  return config;
}
