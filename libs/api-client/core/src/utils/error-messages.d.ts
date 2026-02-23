/**
 * Error Message Mapping Utility
 *
 * Maps error codes to user-friendly messages.
 * Uses i18n keys when available, falls back to default messages.
 *
 * Error Code Categories:
 * - P1xx: Platform errors (capability not available)
 * - R2xx: Protocol errors (connection failed, timeout)
 * - N3xx: Network errors (unreachable, DNS, timeout)
 * - V4xx: Validation errors (schema, reference, conflict)
 * - A5xx: Auth errors (failed, insufficient, expired)
 * - S6xx: Resource errors (not found, locked, invalid state)
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
/**
 * Error code categories
 */
export type ErrorCategory = 'P1' | 'R2' | 'N3' | 'V4' | 'A5' | 'S6';
/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
/**
 * Structured error information
 */
export interface ErrorInfo {
    /** User-friendly error message */
    message: string;
    /** Error severity */
    severity: ErrorSeverity;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Suggested action */
    action?: string;
    /** i18n key for translation */
    i18nKey?: string;
}
/**
 * Get error category from error code
 */
export declare function getErrorCategory(code: string): ErrorCategory | undefined;
/**
 * Get error severity from error code
 */
export declare function getErrorSeverity(code: string | undefined): ErrorSeverity;
/**
 * Check if error is recoverable
 */
export declare function isRecoverableError(code: string | undefined): boolean;
/**
 * Get user-friendly error message for an error code
 *
 * @param code - Error code (e.g., "N300", "A501")
 * @param fallbackMessage - Fallback if code not found
 * @returns User-friendly message
 *
 * @example
 * ```ts
 * const message = getErrorMessage('N300');
 * // "Cannot reach the router"
 *
 * const message = getErrorMessage('UNKNOWN', 'Something went wrong');
 * // "Something went wrong"
 * ```
 */
export declare function getErrorMessage(code: string | undefined, fallbackMessage?: string): string;
/**
 * Get detailed error information for an error code
 *
 * @param code - Error code
 * @param fallbackMessage - Fallback message if code not found
 * @returns Detailed error information
 *
 * @example
 * ```ts
 * const info = getErrorInfo('A502');
 * // {
 * //   message: 'Your session has expired',
 * //   severity: 'warning',
 * //   recoverable: true,
 * //   action: 'Please log in again',
 * //   i18nKey: 'errors.auth.expired'
 * // }
 * ```
 */
export declare function getErrorInfo(code: string | undefined, fallbackMessage?: string): ErrorInfo;
/**
 * Get suggested action for an error code
 */
export declare function getErrorAction(code: string | undefined): string | undefined;
/**
 * Check if error code indicates auth error
 */
export declare function isAuthError(code: string | undefined): boolean;
/**
 * Check if error code indicates network error
 */
export declare function isNetworkError(code: string | undefined): boolean;
/**
 * Check if error code indicates validation error
 */
export declare function isValidationError(code: string | undefined): boolean;
//# sourceMappingURL=error-messages.d.ts.map