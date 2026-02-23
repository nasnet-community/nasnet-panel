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
const CREDENTIAL_STORAGE_KEY = 'nasnet.router.credentials';

/**
 * Validates credentials by attempting connection to router through proxy
 *
 * @description Attempts to validate provided credentials by connecting to the router via HTTP
 * proxy endpoint. Fetches router system identity to confirm successful authentication.
 * Returns structured result with validation status and optional router information.
 *
 * @param ipAddress - Router IP address
 * @param credentials - Username and password to test
 * @returns Promise with validation result containing isValid flag and optional error/routerInfo
 *
 * @throws No direct throw - all errors converted to CredentialValidationResult with error message
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
          error: 'Authentication failed. Check that username and password are correct.',
        };
      }

      return {
        isValid: false,
        error: `Router returned error: ${proxyResponse.status_text || 'HTTP ' + proxyResponse.status}`,
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
          error: 'Authentication failed. Check that username and password are correct.',
        };
      }

      if (error.code === 'ECONNREFUSED') {
        return {
          isValid: false,
          error: 'Cannot reach router proxy. Verify the proxy service is running and the IP address is correct.',
        };
      }

      if (error.code === 'ETIMEDOUT') {
        return {
          isValid: false,
          error: 'Connection timed out. Check network connectivity to the router.',
        };
      }

      // Handle errors from rosproxy
      if (error.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
        const proxyResponse = error.response.data as { status: number; status_text?: string };
        if (proxyResponse.status === 401 || proxyResponse.status === 403) {
          return {
            isValid: false,
            error: 'Authentication failed. Check that username and password are correct.',
          };
        }
      }

      return {
        isValid: false,
        error: error.message || 'Connection error. Unable to validate credentials.',
      };
    }

    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unexpected error during credential validation.',
    };
  }
}

/**
 * Saves credentials to localStorage
 *
 * @description Persists router credentials to browser localStorage with timestamp.
 * Updates existing credentials for the same router ID. Credentials stored in plain text
 * (encryption planned for Phase 1.4).
 *
 * @param routerId - Router ID
 * @param credentials - Credentials to save (username and password)
 * @throws {CredentialError} If localStorage write fails
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

    localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[credentialService] Failed to save credentials:', error);
    throw new CredentialError(
      'Failed to save credentials to browser storage. Check that storage is available and not full.',
      'SAVE_FAILED'
    );
  }
}

/**
 * Loads credentials for a specific router
 *
 * @description Retrieves saved credentials from localStorage for the given router ID.
 * Returns null if credentials not found or on storage access error.
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
 * @description Deletes saved credentials for a specific router ID from localStorage.
 * Does not throw if router ID does not exist.
 *
 * @param routerId - Router ID
 * @throws {CredentialError} If localStorage write fails
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
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[credentialService] Failed to remove credentials:', error);
    throw new CredentialError(
      'Failed to remove credentials from storage. Check that browser storage is accessible.',
      'REMOVE_FAILED'
    );
  }
}

/**
 * Clears all saved credentials
 *
 * @description Removes all saved router credentials from localStorage. Useful for
 * logout or account reset scenarios.
 *
 * @throws {CredentialError} If localStorage write fails
 *
 * @example
 * ```typescript
 * clearAllCredentials();
 * ```
 */
export function clearAllCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  } catch (error) {
    console.error('[credentialService] Failed to clear credentials:', error);
    throw new CredentialError(
      'Failed to clear credentials from storage. Check that browser storage is accessible.',
      'CLEAR_FAILED'
    );
  }
}

/**
 * Checks if credentials are saved for a router
 *
 * @description Quickly checks whether credentials exist for a specific router ID
 * without loading the full credentials object.
 *
 * @param routerId - Router ID
 * @returns True if credentials exist, false otherwise
 */
export function hasCredentials(routerId: string): boolean {
  const stored = loadAllCredentials();
  return routerId in stored;
}

/**
 * Gets all router IDs that have saved credentials
 *
 * @description Returns a list of all router IDs for which credentials have been saved.
 * Useful for populating auto-connect lists or credential management UI.
 *
 * @returns Array of router IDs
 */
export function getRoutersWithCredentials(): string[] {
  const stored = loadAllCredentials();
  return Object.keys(stored);
}

/**
 * Loads all credentials from localStorage
 *
 * @description Internal helper function. Safely retrieves and parses all stored credentials.
 * Returns empty object if storage is empty, inaccessible, or corrupted.
 * Does not throw on errors - logs and returns graceful empty state.
 *
 * @returns StoredCredentials object (may be empty if none saved)
 */
function loadAllCredentials(): StoredCredentials {
  try {
    const json = localStorage.getItem(CREDENTIAL_STORAGE_KEY);

    if (!json) {
      return {};
    }

    const parsed = JSON.parse(json) as StoredCredentials;

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('[credentialService] Invalid credentials format in storage, resetting');
      return {};
    }

    return parsed;
  } catch (error) {
    console.error('[credentialService] Failed to parse credentials from storage:', error);
    return {};
  }
}

/**
 * Type guard for Axios errors
 *
 * @description Checks if an error is an Axios error with response/code/message properties.
 * Internal helper function for error handling.
 *
 * @param error - Error object to check
 * @returns True if error matches Axios error shape
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
 *
 * @description Error class for credential management failures. Includes structured error codes
 * for handling storage and persistence issues.
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
 *
 * @description MikroTik routers ship with 'admin' user and no password by default.
 * These defaults are offered as a quick-start option in the credential form.
 */
export const DEFAULT_CREDENTIALS: RouterCredentials = {
  username: 'admin',
  password: '',
};
