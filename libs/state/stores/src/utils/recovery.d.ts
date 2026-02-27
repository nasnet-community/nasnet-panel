/**
 * Error Recovery Utilities
 *
 * Utilities for recovering from various error states including:
 * - Automatic retry with exponential backoff
 * - Manual retry helpers
 * - Cache clearing for data corruption
 * - Issue reporting
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay cap in ms (default: 30000) */
  maxDelayMs?: number;
  /** Whether to show notifications (default: true) */
  showNotifications?: boolean;
  /** Callback before each retry */
  onRetry?: (attempt: number, error: Error) => void;
  /** Callback on final failure */
  onMaxRetriesExceeded?: (error: Error) => void;
  /** Should retry predicate (default: always retry) */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
/**
 * Retry result
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error (if failed) */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
}
/**
 * Issue report data
 */
export interface IssueReport {
  /** Error message */
  message: string;
  /** Error code (if available) */
  code?: string;
  /** Stack trace (if available) */
  stack?: string;
  /** Component where error occurred */
  component?: string;
  /** Current URL */
  url: string;
  /** Timestamp */
  timestamp: string;
  /** User agent */
  userAgent: string;
  /** Additional context */
  context?: Record<string, unknown>;
}
/**
 * Execute an operation with automatic retry and exponential backoff.
 *
 * @param operation - Async operation to execute
 * @param config - Retry configuration
 * @returns Result with success status, data, and attempt count
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetchRouterData(routerId),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`),
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export declare function withRetry<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): Promise<RetryResult<T>>;
/**
 * Create a retry handler for a specific operation.
 *
 * Returns a function that can be called to retry the operation.
 *
 * @param operation - Async operation to execute
 * @param config - Retry configuration
 * @returns Retry function
 *
 * @example
 * ```tsx
 * function DataComponent() {
 *   const [data, setData] = useState(null);
 *   const [error, setError] = useState(null);
 *
 *   const retry = createRetryHandler(
 *     async () => {
 *       const result = await fetchData();
 *       setData(result);
 *       setError(null);
 *     },
 *     {
 *       onMaxRetriesExceeded: (err) => setError(err),
 *     }
 *   );
 *
 *   return error ? (
 *     <ErrorCard onRetry={retry} />
 *   ) : (
 *     <DataDisplay data={data} />
 *   );
 * }
 * ```
 */
export declare function createRetryHandler<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): () => Promise<RetryResult<T>>;
/**
 * Clear all Apollo cache data.
 *
 * Use this when data corruption is suspected or when
 * the user wants to start fresh.
 *
 * @example
 * ```ts
 * // In error recovery
 * await clearAllCache();
 * window.location.reload();
 * ```
 */
export declare function clearAllCache(): Promise<void>;
/**
 * Clear cache and reload the page.
 *
 * Use for severe data corruption or persistent errors.
 */
export declare function clearCacheAndReload(): Promise<void>;
/**
 * Generate an issue report for the current error.
 *
 * @param error - The error to report
 * @param context - Additional context
 * @returns Issue report data
 */
export declare function generateIssueReport(
  error: Error,
  context?: Record<string, unknown>
): IssueReport;
/**
 * Copy issue report to clipboard.
 *
 * @param error - The error to report
 * @param context - Additional context
 */
export declare function copyIssueReport(
  error: Error,
  context?: Record<string, unknown>
): Promise<void>;
/**
 * Open GitHub issues page with pre-filled error report.
 *
 * @param error - The error to report
 * @param context - Additional context
 */
export declare function openIssueReporter(error: Error, context?: Record<string, unknown>): void;
/**
 * Available recovery actions
 */
export interface RecoveryActions {
  /** Retry the failed operation */
  retry: () => Promise<void>;
  /** Clear cache and retry */
  clearCacheAndRetry: () => Promise<void>;
  /** Copy error report to clipboard */
  copyReport: () => Promise<void>;
  /** Open issue reporter */
  reportIssue: () => void;
  /** Reload the page */
  reload: () => void;
  /** Go to home page */
  goHome: () => void;
  /** Go back in history */
  goBack: () => void;
}
/**
 * Create recovery actions for an error.
 *
 * @param error - The error that occurred
 * @param retryFn - Optional retry function
 * @param context - Additional context for reporting
 * @returns Recovery actions
 *
 * @example
 * ```tsx
 * function ErrorDisplay({ error, onRetry }) {
 *   const actions = createRecoveryActions(error, onRetry);
 *
 *   return (
 *     <div>
 *       <Button onClick={actions.retry}>Retry</Button>
 *       <Button onClick={actions.clearCacheAndRetry}>Clear Cache & Retry</Button>
 *       <Button onClick={actions.copyReport}>Copy Error Details</Button>
 *       <Button onClick={actions.reportIssue}>Report Issue</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function createRecoveryActions(
  error: Error,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions;
/**
 * Hook for using recovery actions in components.
 *
 * @param error - The error to recover from
 * @param retryFn - Optional retry function
 * @returns Recovery actions
 *
 * @example
 * ```tsx
 * function ErrorComponent({ error }) {
 *   const { refetch } = useQuery(GET_DATA);
 *   const recovery = useRecoveryActions(error, refetch);
 *
 *   return (
 *     <ErrorCard
 *       onRetry={recovery.retry}
 *       onReport={recovery.reportIssue}
 *     />
 *   );
 * }
 * ```
 */
export declare function useRecoveryActions(
  error: Error | null,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions | null;
//# sourceMappingURL=recovery.d.ts.map
