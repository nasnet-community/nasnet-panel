/**
 * Error Logging Utility
 *
 * Structured error logging for development and production.
 * Prepares for future observability integration (NAS-13.8).
 *
 * Features:
 * - Throttled error logging (max 10 errors/minute)
 * - Structured log format
 * - Console logging in development
 * - Buffered batch sending in production (ready for observability backend)
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
    /** Error code (e.g., N300, A501) */
    code?: string;
    /** Error message */
    message: string;
    /** GraphQL operation name */
    operation?: string;
    /** Additional context */
    context?: Record<string, unknown>;
    /** Timestamp (auto-generated) */
    timestamp: number;
    /** Error stack trace */
    stack?: string;
    /** Current URL */
    url?: string;
    /** Component name where error occurred */
    component?: string;
}
/**
 * Input for logging (without auto-generated fields)
 */
export type ErrorLogInput = Omit<ErrorLogEntry, 'timestamp' | 'url'>;
/**
 * Log an error with structured format
 *
 * In development: Logs to console immediately
 * In production: Buffers for batch sending
 *
 * @param entry - Error log entry
 *
 * @example
 * ```ts
 * logError({
 *   code: 'N300',
 *   message: 'Connection failed',
 *   operation: 'GetRouter',
 *   context: { routerId: '123' },
 * });
 * ```
 */
export declare function logError(entry: ErrorLogInput): void;
/**
 * Log a GraphQL error
 *
 * @param operation - GraphQL operation name
 * @param error - Error from GraphQL response
 *
 * @example
 * ```ts
 * logGraphQLError('GetRouter', {
 *   message: 'Connection failed',
 *   extensions: { code: 'N300' },
 * });
 * ```
 */
export declare function logGraphQLError(operation: string, error: {
    message: string;
    extensions?: {
        code?: string;
    };
}, context?: Record<string, unknown>): void;
/**
 * Log a network error
 *
 * @param operation - Operation that failed
 * @param error - Network error
 *
 * @example
 * ```ts
 * logNetworkError('GetRouter', new Error('Network timeout'));
 * ```
 */
export declare function logNetworkError(operation: string, error: Error, context?: Record<string, unknown>): void;
/**
 * Log a component error (from error boundary)
 *
 * @param component - Component name
 * @param error - Error that was caught
 * @param errorInfo - React error info
 *
 * @example
 * ```ts
 * logComponentError('RouterCard', error, errorInfo);
 * ```
 */
export declare function logComponentError(component: string, error: Error, errorInfo?: {
    componentStack?: string;
}): void;
/**
 * Manually flush error buffer
 * Call this on app unload or critical events
 */
export declare function flushErrorBuffer(): void;
/**
 * Get current buffer size (for monitoring)
 */
export declare function getErrorBufferSize(): number;
//# sourceMappingURL=error-logging.d.ts.map