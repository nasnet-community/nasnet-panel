/**
 * useGraphQLError Hook
 *
 * Component-level error handling hook for GraphQL operations.
 * Provides user-friendly error messages and recovery actions.
 *
 * Features:
 * - Error code to user message mapping
 * - Automatic severity detection
 * - Retry handler creation
 * - Integration with notification store
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { useMemo, useCallback } from 'react';
import { ApolloError } from '@apollo/client';
import { useNotificationStore } from '@nasnet/state/stores';
import {
  getErrorMessage,
  getErrorInfo,
  isAuthError,
  isNetworkError,
  isValidationError,
  type ErrorSeverity,
} from '../utils/error-messages';
import { logGraphQLError } from '../utils/error-logging';

// ===== Types =====

/**
 * Processed error information for UI display
 */
export interface ProcessedError {
  /** User-friendly error message */
  message: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error code if available */
  code?: string;
  /** Technical error message (for details view) */
  technicalMessage?: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Suggested action for user */
  action?: string;
  /** Whether this is an auth error (session expired) */
  isAuthError: boolean;
  /** Whether this is a network error */
  isNetworkError: boolean;
  /** Whether this is a validation error */
  isValidationError: boolean;
  /** Original error object */
  originalError?: ApolloError | Error;
}

/**
 * Return type for useGraphQLError hook
 */
export interface UseGraphQLErrorReturn {
  /** Processed error for UI display (null if no error) */
  error: ProcessedError | null;
  /** Whether there is an error */
  hasError: boolean;
  /** Clear the error state */
  clearError: () => void;
  /** Show error as toast notification */
  showErrorToast: () => void;
  /** Create a retry handler that clears error on success */
  createRetryHandler: <T>(fn: () => Promise<T>) => () => Promise<T | undefined>;
}

/**
 * Options for useGraphQLError hook
 */
export interface UseGraphQLErrorOptions {
  /** Auto-show toast on error */
  showToast?: boolean;
  /** Log errors to console/observability */
  logErrors?: boolean;
  /** Operation name for logging */
  operationName?: string;
  /** Skip validation errors (handled by forms) */
  skipValidationErrors?: boolean;
}

// ===== Hook =====

/**
 * Process Apollo or generic errors into user-friendly format
 */
function processError(error: ApolloError | Error | undefined): ProcessedError | null {
  if (!error) return null;

  // Handle ApolloError
  if (error instanceof ApolloError) {
    const graphQLError = error.graphQLErrors[0];
    const code = graphQLError?.extensions?.code as string | undefined;
    const errorInfo = getErrorInfo(code, error.message);

    return {
      message: errorInfo.message,
      severity: errorInfo.severity,
      code,
      technicalMessage: error.message,
      recoverable: errorInfo.recoverable,
      action: errorInfo.action,
      isAuthError: isAuthError(code),
      isNetworkError: isNetworkError(code) || !!error.networkError,
      isValidationError: isValidationError(code),
      originalError: error,
    };
  }

  // Handle generic errors
  return {
    message: getErrorMessage(undefined, error.message),
    severity: 'error',
    technicalMessage: error.message,
    recoverable: true,
    isAuthError: false,
    isNetworkError: error.message.toLowerCase().includes('network'),
    isValidationError: false,
    originalError: error,
  };
}

/**
 * Hook for component-level GraphQL error handling
 *
 * @param apolloError - Error from Apollo query/mutation
 * @param options - Configuration options
 * @returns Processed error info and utilities
 *
 * @example Basic usage with Apollo query
 * ```tsx
 * function RouterCard({ routerId }) {
 *   const { data, error: apolloError, refetch } = useQuery(GET_ROUTER);
 *   const { error, hasError, showErrorToast } = useGraphQLError(apolloError);
 *
 *   if (hasError) {
 *     return (
 *       <ErrorCard
 *         title={error.message}
 *         type={error.isNetworkError ? 'network' : 'error'}
 *         onRetry={refetch}
 *       />
 *     );
 *   }
 *
 *   return <RouterDetails data={data} />;
 * }
 * ```
 *
 * @example With mutation error handling
 * ```tsx
 * function UpdateForm() {
 *   const [updateRouter, { error: apolloError }] = useMutation(UPDATE_ROUTER);
 *   const { error, createRetryHandler, showErrorToast } = useGraphQLError(apolloError, {
 *     showToast: true,
 *     operationName: 'UpdateRouter',
 *   });
 *
 *   const handleSubmit = createRetryHandler(async () => {
 *     await updateRouter({ variables: { id, data } });
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <ErrorCard title={error.message} />}
 *       ...
 *     </form>
 *   );
 * }
 * ```
 *
 * @example Skip validation errors (handled by form)
 * ```tsx
 * const { error } = useGraphQLError(apolloError, {
 *   skipValidationErrors: true,
 * });
 * // Validation errors will be handled by React Hook Form
 * ```
 */
export function useGraphQLError(
  apolloError: ApolloError | Error | undefined,
  options: UseGraphQLErrorOptions = {}
): UseGraphQLErrorReturn {
  const {
    showToast = false,
    logErrors = true,
    operationName,
    skipValidationErrors = false,
  } = options;

  const addNotification = useNotificationStore((state) => state.addNotification);

  // Process error
  const error = useMemo(() => {
    const processed = processError(apolloError);

    // Skip validation errors if configured
    if (processed && skipValidationErrors && processed.isValidationError) {
      return null;
    }

    // Log error if configured
    if (processed && logErrors && apolloError) {
      logGraphQLError(
        operationName || 'unknown',
        {
          message: apolloError.message,
          extensions: processed.code ? { code: processed.code } : undefined,
        },
        { recoverable: processed.recoverable }
      );
    }

    return processed;
  }, [apolloError, skipValidationErrors, logErrors, operationName]);

  // Show error as toast notification
  const showErrorToast = useCallback(() => {
    if (!error) return;

    addNotification({
      type: error.severity === 'warning' ? 'warning' : 'error',
      title: error.message,
      message: error.action,
    });
  }, [error, addNotification]);

  // Auto-show toast if configured
  useMemo(() => {
    if (showToast && error) {
      showErrorToast();
    }
  }, [showToast, error, showErrorToast]);

  // Clear error (not directly possible with Apollo, but useful for local state)
  const clearError = useCallback(() => {
    // Apollo errors are managed by Apollo, so this is a no-op
    // But could be used with local error state
  }, []);

  // Create retry handler that handles errors gracefully
  const createRetryHandler = useCallback(
    <T>(fn: () => Promise<T>) => {
      return async (): Promise<T | undefined> => {
        try {
          return await fn();
        } catch (err) {
          // Error will be captured by Apollo and trigger re-render
          // Log for observability
          if (logErrors && err instanceof Error) {
            logGraphQLError(operationName || 'retry', {
              message: err.message,
            });
          }
          return undefined;
        }
      };
    },
    [logErrors, operationName]
  );

  return {
    error,
    hasError: error !== null,
    clearError,
    showErrorToast,
    createRetryHandler,
  };
}

/**
 * Type guard to check if error is an ApolloError
 */
export function isApolloError(error: unknown): error is ApolloError {
  return error instanceof ApolloError;
}

/**
 * Extract error code from Apollo error
 */
export function getApolloErrorCode(error: ApolloError): string | undefined {
  return error.graphQLErrors[0]?.extensions?.code as string | undefined;
}
