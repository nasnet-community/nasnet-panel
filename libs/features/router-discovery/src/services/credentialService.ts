/**
 * Credential Management Service
 * Handles credential validation, persistence, and retrieval (Epic 0.1, Stories 0-1-4, 0-1-6)
 */

import type { RouterCredentials } from '@nasnet/core/types';
import axios from 'axios';

/**
 * Stored credentials format in localStorage
 */
interface StoredCredentials {
  [routerId: string]: {
    username: string;
    password: string; // TODO: Encryption in Phase 1 (Epic 1.4)
    savedAt: string; // ISO date string
  };
}

/**
 * Validation result from credential test
 */
export interface CredentialValidationResult {
  isValid: boolean;
  error?: string;
  routerInfo?: {
    identity?: string;
    model?: string;
    version?: string;
  };
}

/**
 * Configuration
 */
const STORAGE_KEY = 'nasnet.router.credentials';

/**
 * Validates credentials by attempting connection to router through proxy
 *
 * @param ipAddress - Router IP address
 * @param credentials - Username and password to test
 * @returns Promise with validation result
 *
 * @example
 * ```typescript
 * const result = await validateCredentials("192.168.88.1", {
 *   username: "admin",
 *   password: "password123"
 * });
 *
 * if (result.isValid) {
 *   console.log("Connected to:", result.routerInfo?.identity);
 * } else {
 *   console.error("Failed:", result.error);
 * }
 * ```
 */
export async function validateCredentials(
  ipAddress: string,
  credentials: RouterCredentials
): Promise<CredentialValidationResult> {
  try {
    // Create Basic Auth header
    const authString = `${credentials.username}:${credentials.password}`;
    const authHeader = `Basic ${btoa(authString)}`;

    // Send request through rosproxy
    // Use axios directly to avoid apiClient's /api/v1 baseURL
    const response = await axios.post('/api/router/proxy', {
      router_ip: ipAddress,
      endpoint: '/rest/system/identity',
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    // rosproxy returns {status, status_text, headers, body}
    const proxyResponse = response.data;

    // Check if the proxied request was successful
    if (proxyResponse.status !== 200) {
      if (proxyResponse.status === 401 || proxyResponse.status === 403) {
        return {
          isValid: false,
          error: 'Invalid username or password',
        };
      }

      return {
        isValid: false,
        error: proxyResponse.status_text || 'Connection failed',
      };
    }

    // Extract router information from response body
    const routerInfo = {
      identity: proxyResponse.body?.name || 'Unknown',
      model: proxyResponse.body?.['board-name'],
      version: proxyResponse.body?.version,
    };

    return {
      isValid: true,
      routerInfo,
    };
  } catch (error: unknown) {
    // Handle validation errors
    if (isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          isValid: false,
          error: 'Invalid username or password',
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          isValid: false,
          error: 'Cannot connect to router proxy. Check network connection.',
        };
      }

      // Handle errors from rosproxy
      if (error.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
        const proxyResponse = error.response.data as { status: number; status_text?: string };
        if (proxyResponse.status === 401 || proxyResponse.status === 403) {
          return {
            isValid: false,
            error: 'Invalid username or password',
          };
        }
      }

      return {
        isValid: false,
        error: error.message || 'Unknown connection error',
      };
    }

    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Saves credentials to localStorage
 *
 * @param routerId - Router ID
 * @param credentials - Credentials to save
 *
 * @example
 * ```typescript
 * saveCredentials("router-123", {
 *   username: "admin",
 *   password: "password123"
 * });
 * ```
 */
export function saveCredentials(
  routerId: string,
  credentials: RouterCredentials
): void {
  try {
    const stored = loadAllCredentials();

    stored[routerId] = {
      username: credentials.username,
      password: credentials.password,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[credentialService] Failed to save credentials:', error);
    throw new CredentialError(
      'Failed to save credentials to storage',
      'SAVE_FAILED'
    );
  }
}

/**
 * Loads credentials for a specific router
 *
 * @param routerId - Router ID
 * @returns Credentials if found, null otherwise
 *
 * @example
 * ```typescript
 * const creds = loadCredentials("router-123");
 * if (creds) {
 *   // Auto-connect with saved credentials
 * }
 * ```
 */
export function loadCredentials(routerId: string): RouterCredentials | null {
  try {
    const stored = loadAllCredentials();
    const entry = stored[routerId];

    if (!entry) {
      return null;
    }

    return {
      username: entry.username,
      password: entry.password,
    };
  } catch (error) {
    console.error('[credentialService] Failed to load credentials:', error);
    return null;
  }
}

/**
 * Removes credentials for a specific router
 *
 * @param routerId - Router ID
 *
 * @example
 * ```typescript
 * removeCredentials("router-123");
 * ```
 */
export function removeCredentials(routerId: string): void {
  try {
    const stored = loadAllCredentials();
    delete stored[routerId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[credentialService] Failed to remove credentials:', error);
    throw new CredentialError(
      'Failed to remove credentials from storage',
      'REMOVE_FAILED'
    );
  }
}

/**
 * Clears all saved credentials
 *
 * @example
 * ```typescript
 * clearAllCredentials();
 * ```
 */
export function clearAllCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[credentialService] Failed to clear credentials:', error);
    throw new CredentialError(
      'Failed to clear all credentials',
      'CLEAR_FAILED'
    );
  }
}

/**
 * Checks if credentials are saved for a router
 *
 * @param routerId - Router ID
 * @returns True if credentials exist
 */
export function hasCredentials(routerId: string): boolean {
  const stored = loadAllCredentials();
  return routerId in stored;
}

/**
 * Gets all router IDs that have saved credentials
 *
 * @returns Array of router IDs
 */
export function getRoutersWithCredentials(): string[] {
  const stored = loadAllCredentials();
  return Object.keys(stored);
}

/**
 * Loads all credentials from localStorage
 * Internal helper function
 */
function loadAllCredentials(): StoredCredentials {
  try {
    const json = localStorage.getItem(STORAGE_KEY);

    if (!json) {
      return {};
    }

    const parsed = JSON.parse(json) as StoredCredentials;

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('[credentialService] Invalid credentials format, resetting');
      return {};
    }

    return parsed;
  } catch (error) {
    console.error('[credentialService] Failed to parse credentials:', error);
    return {};
  }
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is {
  response?: { status?: number; data?: unknown };
  code?: string;
  message?: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'code' in error || 'message' in error)
  );
}

/**
 * Custom error class for credential operations
 */
export class CredentialError extends Error {
  constructor(
    message: string,
    public code: 'SAVE_FAILED' | 'REMOVE_FAILED' | 'CLEAR_FAILED'
  ) {
    super(message);
    this.name = 'CredentialError';
  }
}

/**
 * Default credentials (common MikroTik defaults)
 */
export const DEFAULT_CREDENTIALS: RouterCredentials = {
  username: 'admin',
  password: '',
};
