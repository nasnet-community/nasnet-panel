/**
 * Credential Management Service
 * Handles credential validation, persistence, and retrieval (Epic 0.1, Stories 0-1-4, 0-1-6)
 */
import type { RouterCredentials } from '@nasnet/core/types';
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
export declare function validateCredentials(ipAddress: string, credentials: RouterCredentials): Promise<CredentialValidationResult>;
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
export declare function saveCredentials(routerId: string, credentials: RouterCredentials): void;
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
export declare function loadCredentials(routerId: string): RouterCredentials | null;
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
export declare function removeCredentials(routerId: string): void;
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
export declare function clearAllCredentials(): void;
/**
 * Checks if credentials are saved for a router
 *
 * @description Quickly checks whether credentials exist for a specific router ID
 * without loading the full credentials object.
 *
 * @param routerId - Router ID
 * @returns True if credentials exist, false otherwise
 */
export declare function hasCredentials(routerId: string): boolean;
/**
 * Gets all router IDs that have saved credentials
 *
 * @description Returns a list of all router IDs for which credentials have been saved.
 * Useful for populating auto-connect lists or credential management UI.
 *
 * @returns Array of router IDs
 */
export declare function getRoutersWithCredentials(): string[];
/**
 * Custom error class for credential operations
 *
 * @description Error class for credential management failures. Includes structured error codes
 * for handling storage and persistence issues.
 */
export declare class CredentialError extends Error {
    code: 'SAVE_FAILED' | 'REMOVE_FAILED' | 'CLEAR_FAILED';
    constructor(message: string, code: 'SAVE_FAILED' | 'REMOVE_FAILED' | 'CLEAR_FAILED');
}
/**
 * Default credentials (common MikroTik defaults)
 *
 * @description MikroTik routers ship with 'admin' user and no password by default.
 * These defaults are offered as a quick-start option in the credential form.
 */
export declare const DEFAULT_CREDENTIALS: RouterCredentials;
//# sourceMappingURL=credentialService.d.ts.map