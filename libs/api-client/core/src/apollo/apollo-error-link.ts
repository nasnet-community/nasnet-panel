/// <reference types="vite/client" />

/**
 * Apollo Error Handling Link
 *
 * Centralized error handling for GraphQL and network errors.
 * Integrates with auth and notification stores for user feedback.
 *
 * @module @nasnet/api-client/core/apollo
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { onError } from '@apollo/client/link/error';
import { useAuthStore, useNotificationStore } from '@nasnet/state/stores';
import {
  getErrorMessage,
  getErrorInfo,
  isAuthError as checkAuthError,
  isValidationError as checkValidationError,
} from '../utils/error-messages';
import { logGraphQLError, logNetworkError } from '../utils/error-logging';

// ===== Types =====

/**
 * Extended network error with status code
 */
interface NetworkErrorWithStatus extends Error {
  statusCode?: number;
  response?: {
    status?: number;
  };
}

// ===== Helper Functions =====

/**
 * Handle authentication errors.
 * Clears auth state and shows notification.
 */
function handleAuthError(message?: string) {
  // Clear auth state
  useAuthStore.getState().clearAuth();

  // Show notification
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: 'Session expired',
    message: message || 'Your session has expired. Please log in again.',
  });

  // Dispatch event for any listeners (e.g., router redirect)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
}

/**
 * Handle network errors.
 * Updates connection state and shows notification.
 */
function handleNetworkError(error: Error) {
  // Show notification for network errors
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: 'Network error',
    message: 'Unable to reach the server. Please check your connection.',
  });

  // Dispatch event for network status tracking
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('network:error', {
        detail: { error },
      })
    );
  }
}

/**
 * Get HTTP status code from network error
 */
function getStatusCode(error: NetworkErrorWithStatus): number | undefined {
  return error.statusCode ?? error.response?.status;
}

// ===== Error Link =====

/**
 * Apollo error handling link.
 *
 * Handles:
 * - GraphQL errors: Validation, authentication, business logic errors
 * - Network errors: Connectivity issues, timeouts, HTTP errors
 *
 * GraphQL Error Codes:
 * - UNAUTHENTICATED: Clears auth store, redirects to login
 * - FORBIDDEN: User lacks permission for operation
 * - NOT_FOUND: Requested resource doesn't exist
 * - VALIDATION_FAILED: Input validation errors
 *
 * HTTP Status Codes:
 * - 401 Unauthorized: Clears auth store, redirects to login
 * - 403 Forbidden: Shows permission denied notification
 *
 * Integration:
 * - useAuthStore: Cleared on 401/UNAUTHENTICATED
 * - useNotificationStore: Shows error toasts
 * - Custom events: auth:expired, network:error
 *
 * Usage:
 * ```ts
 * import { ApolloClient, from } from '@apollo/client';
 * import { errorLink } from './apollo-error-link';
 *
 * const client = new ApolloClient({
 *   link: from([errorLink, authLink, httpLink]),
 *   cache: new InMemoryCache(),
 * });
 * ```
 */
export const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // Handle GraphQL errors
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      const { message, locations, path, extensions } = error;
      const errorCode = extensions?.code as string | undefined;

      // Log error with structured format
      logGraphQLError(operation.operationName, error, {
        path: path?.join('.'),
        variables: operation.variables,
      });

      // Skip validation errors (handled by forms)
      if (checkValidationError(errorCode)) {
        if (import.meta.env?.DEV) {
          console.warn('[Validation Error - handled by form]:', message);
        }
        continue;
      }

      // Handle auth errors (A5xx codes or UNAUTHENTICATED)
      if (checkAuthError(errorCode) || errorCode === 'UNAUTHENTICATED') {
        handleAuthError(message);
        continue;
      }

      // Handle specific error codes with legacy support
      switch (errorCode) {
        case 'FORBIDDEN': {
          useNotificationStore.getState().addNotification({
            type: 'error',
            title: 'Access denied',
            message: 'You do not have permission to perform this action.',
          });
          break;
        }

        case 'NOT_FOUND': {
          useNotificationStore.getState().addNotification({
            type: 'warning',
            title: 'Not found',
            message: message || 'The requested resource was not found.',
          });
          break;
        }

        default: {
          // Use error message mapping for user-friendly messages
          const errorInfo = getErrorInfo(errorCode, message);
          useNotificationStore.getState().addNotification({
            type: errorInfo.severity === 'warning' ? 'warning' : 'error',
            title: errorInfo.message,
            message: errorInfo.action,
          });
        }
      }
    }
  }

  // Handle network errors
  if (networkError) {
    const statusCode = getStatusCode(networkError as NetworkErrorWithStatus);

    // Log network error with structured format
    logNetworkError(operation.operationName, networkError, {
      statusCode,
      variables: operation.variables,
    });

    // Handle specific HTTP status codes
    if (statusCode === 401) {
      handleAuthError('Authentication failed. Please log in again.');
      return;
    }

    if (statusCode === 403) {
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Access denied',
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    // Handle generic network errors
    handleNetworkError(networkError);
  }
});

/**
 * Create error link with custom handlers.
 *
 * Use this when you need custom error handling logic.
 *
 * @param onAuthError - Custom auth error handler
 * @param onNetworkError - Custom network error handler
 * @returns Apollo error link
 */
export function createErrorLink(options: {
  onAuthError?: (message: string) => void;
  onNetworkError?: (error: Error) => void;
}) {
  return onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const error of graphQLErrors) {
        const errorCode = error.extensions?.code as string | undefined;

        if (errorCode === 'UNAUTHENTICATED') {
          if (options.onAuthError) {
            options.onAuthError(error.message);
          } else {
            handleAuthError(error.message);
          }
        }
      }
    }

    if (networkError) {
      const statusCode = getStatusCode(networkError as NetworkErrorWithStatus);

      if (statusCode === 401) {
        if (options.onAuthError) {
          options.onAuthError('Authentication failed');
        } else {
          handleAuthError('Authentication failed. Please log in again.');
        }
        return;
      }

      if (options.onNetworkError) {
        options.onNetworkError(networkError);
      } else {
        handleNetworkError(networkError);
      }
    }
  });
}
