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

// ===== Types =====

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

// ===== Configuration =====

/**
 * Maximum errors to buffer before flushing
 */
const MAX_BUFFER_SIZE = 10;

/**
 * Flush interval in milliseconds
 */
const FLUSH_INTERVAL_MS = 60000; // 1 minute

/**
 * Throttle window for duplicate errors (ms)
 */
const THROTTLE_WINDOW_MS = 5000; // 5 seconds

// ===== State =====

/**
 * Error buffer for batch sending
 */
const errorBuffer: ErrorLogEntry[] = [];

/**
 * Last flush timestamp
 */
let lastFlush = Date.now();

/**
 * Recent error hashes for deduplication
 */
const recentErrors = new Map<string, number>();

// ===== Helper Functions =====

/**
 * Generate hash for error deduplication
 */
function getErrorHash(entry: ErrorLogInput): string {
  return `${entry.code || ''}:${entry.message}:${entry.operation || ''}`;
}

/**
 * Check if error is duplicate (within throttle window)
 */
function isDuplicateError(hash: string): boolean {
  const lastSeen = recentErrors.get(hash);
  if (!lastSeen) return false;
  return Date.now() - lastSeen < THROTTLE_WINDOW_MS;
}

/**
 * Mark error as seen
 */
function markErrorSeen(hash: string): void {
  const now = Date.now();
  recentErrors.set(hash, now);

  // Clean up old entries
  for (const [key, time] of recentErrors.entries()) {
    if (now - time > THROTTLE_WINDOW_MS) {
      recentErrors.delete(key);
    }
  }
}

/**
 * Flush error buffer to observability backend
 * TODO: NAS-13.8 - Implement actual backend integration
 */
function flushErrors(): void {
  if (errorBuffer.length === 0) return;

  // For now, log to console in production
  if (!import.meta.env.DEV) {
    console.groupCollapsed('[Error Flush] Sending error batch');
    errorBuffer.forEach((entry, i) => {
      console.log(`[${i + 1}/${errorBuffer.length}]`, entry);
    });
    console.groupEnd();
  }

  // TODO: NAS-13.8 - Send to observability backend
  // sendToObservability(errorBuffer.splice(0, errorBuffer.length));

  // Clear buffer
  errorBuffer.length = 0;
  lastFlush = Date.now();
}

// ===== Public API =====

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
export function logError(entry: ErrorLogInput): void {
  const now = Date.now();
  const hash = getErrorHash(entry);

  // Skip duplicates within throttle window
  if (isDuplicateError(hash)) {
    return;
  }
  markErrorSeen(hash);

  const fullEntry: ErrorLogEntry = {
    ...entry,
    timestamp: now,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Development: log to console immediately
  if (import.meta.env.DEV) {
    console.group(
      `%c[Error ${entry.code || 'UNKNOWN'}]`,
      'color: #ef4444; font-weight: bold;'
    );
    console.error('Message:', entry.message);
    if (entry.operation) console.log('Operation:', entry.operation);
    if (entry.context) console.log('Context:', entry.context);
    if (entry.stack) console.log('Stack:', entry.stack);
    console.groupEnd();
    return;
  }

  // Production: buffer for batch sending
  errorBuffer.push(fullEntry);

  // Flush if buffer full or interval elapsed
  if (errorBuffer.length >= MAX_BUFFER_SIZE || now - lastFlush > FLUSH_INTERVAL_MS) {
    flushErrors();
  }
}

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
export function logGraphQLError(
  operation: string,
  error: { message: string; extensions?: { code?: string } },
  context?: Record<string, unknown>
): void {
  logError({
    code: error.extensions?.code,
    message: error.message,
    operation,
    context,
  });
}

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
export function logNetworkError(
  operation: string,
  error: Error,
  context?: Record<string, unknown>
): void {
  logError({
    code: 'N302', // Default to timeout code
    message: error.message,
    operation,
    stack: error.stack,
    context,
  });
}

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
export function logComponentError(
  component: string,
  error: Error,
  errorInfo?: { componentStack?: string }
): void {
  logError({
    message: error.message,
    component,
    stack: error.stack,
    context: errorInfo?.componentStack
      ? { componentStack: errorInfo.componentStack }
      : undefined,
  });
}

/**
 * Manually flush error buffer
 * Call this on app unload or critical events
 */
export function flushErrorBuffer(): void {
  flushErrors();
}

/**
 * Get current buffer size (for monitoring)
 */
export function getErrorBufferSize(): number {
  return errorBuffer.length;
}
