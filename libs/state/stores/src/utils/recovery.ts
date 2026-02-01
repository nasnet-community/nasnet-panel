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

import { apolloClient } from '@nasnet/api-client/core';
import { useNotificationStore } from '../ui/notification.store';
import { calculateBackoff, sleep } from './reconnect';

// ===== Types =====

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

// ===== Retry with Exponential Backoff =====

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
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    showNotifications = true,
    onRetry,
    onMaxRetriesExceeded,
    shouldRetry = () => true,
  } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await operation();
      return { success: true, data, attempts: attempt + 1 };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
        const delay = calculateBackoff(attempt);
        onRetry?.(attempt + 1, lastError);
        await sleep(delay);
      }
    }
  }

  // Max retries exceeded
  if (lastError) {
    onMaxRetriesExceeded?.(lastError);

    if (showNotifications) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Operation failed',
        message: 'Please try again or contact support if the problem persists.',
      });
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxRetries + 1,
  };
}

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
export function createRetryHandler<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): () => Promise<RetryResult<T>> {
  return () => withRetry(operation, config);
}

// ===== Cache Clearing =====

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
export async function clearAllCache(): Promise<void> {
  try {
    // Clear Apollo cache
    if (apolloClient) {
      await apolloClient.clearStore();
    }

    // Clear localStorage cache keys (but not auth)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('apollo-') || key.includes('-cache'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear sessionStorage cache keys
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('apollo-') || key.includes('-cache'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

    useNotificationStore.getState().addNotification({
      type: 'success',
      title: 'Cache cleared',
      message: 'Local data has been cleared. Refreshing...',
    });
  } catch (error) {
    console.error('[Recovery] Failed to clear cache:', error);
    useNotificationStore.getState().addNotification({
      type: 'error',
      title: 'Failed to clear cache',
      message: 'Please try refreshing the page manually.',
    });
  }
}

/**
 * Clear cache and reload the page.
 *
 * Use for severe data corruption or persistent errors.
 */
export async function clearCacheAndReload(): Promise<void> {
  await clearAllCache();
  // Small delay to show notification
  await sleep(500);
  window.location.reload();
}

// ===== Issue Reporting =====

/**
 * Generate an issue report for the current error.
 *
 * @param error - The error to report
 * @param context - Additional context
 * @returns Issue report data
 */
export function generateIssueReport(
  error: Error,
  context?: Record<string, unknown>
): IssueReport {
  return {
    message: error.message,
    code: (error as { code?: string }).code,
    stack: error.stack,
    component: (error as { component?: string }).component,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    context,
  };
}

/**
 * Copy issue report to clipboard.
 *
 * @param error - The error to report
 * @param context - Additional context
 */
export async function copyIssueReport(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  const report = generateIssueReport(error, context);

  try {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));

    useNotificationStore.getState().addNotification({
      type: 'success',
      title: 'Error details copied',
      message: 'You can paste this when reporting the issue.',
    });
  } catch (err) {
    console.error('[Recovery] Failed to copy to clipboard:', err);

    // Fallback: log to console
    console.log('[Issue Report]:', report);

    useNotificationStore.getState().addNotification({
      type: 'info',
      title: 'Error details logged',
      message: 'Check the browser console for error details.',
    });
  }
}

/**
 * Open GitHub issues page with pre-filled error report.
 *
 * @param error - The error to report
 * @param context - Additional context
 */
export function openIssueReporter(
  error: Error,
  context?: Record<string, unknown>
): void {
  const report = generateIssueReport(error, context);

  // Create issue body
  const body = `
## Error Report

**Error:** ${report.message}
${report.code ? `**Code:** ${report.code}` : ''}
**URL:** ${report.url}
**Time:** ${report.timestamp}

### Steps to Reproduce

1. [Describe what you were doing]
2. [Describe what happened]

### Technical Details

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

  // TODO: Replace with actual repo URL
  const issuesUrl = 'https://github.com/owner/NasNet/issues/new';
  const params = new URLSearchParams({
    title: `[Bug] ${error.message.substring(0, 50)}${error.message.length > 50 ? '...' : ''}`,
    body: body.trim(),
    labels: 'bug,auto-generated',
  });

  window.open(`${issuesUrl}?${params.toString()}`, '_blank');
}

// ===== Recovery Actions =====

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
export function createRecoveryActions(
  error: Error,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions {
  return {
    retry: async () => {
      if (retryFn) {
        await retryFn();
      } else {
        window.location.reload();
      }
    },

    clearCacheAndRetry: async () => {
      await clearAllCache();
      if (retryFn) {
        await retryFn();
      } else {
        window.location.reload();
      }
    },

    copyReport: () => copyIssueReport(error, context),

    reportIssue: () => openIssueReporter(error, context),

    reload: () => window.location.reload(),

    goHome: () => {
      window.location.href = '/';
    },

    goBack: () => {
      window.history.back();
    },
  };
}

// ===== React Hook =====

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
export function useRecoveryActions(
  error: Error | null,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions | null {
  if (!error) return null;
  return createRecoveryActions(error, retryFn, context);
}
