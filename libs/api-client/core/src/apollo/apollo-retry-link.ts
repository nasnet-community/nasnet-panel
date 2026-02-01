/**
 * Apollo Retry Link
 *
 * Configures automatic retry with exponential backoff for network errors.
 * Skips retry for client errors (4xx) which are not transient.
 *
 * @module @nasnet/api-client/core/apollo
 */

import { RetryLink } from '@apollo/client/link/retry';

/**
 * HTTP retry link with exponential backoff.
 *
 * Configuration:
 * - Initial delay: 300ms
 * - Max delay: 3000ms (3s)
 * - Jitter enabled for distributed retries
 * - Max 3 attempts
 * - Only retries network errors (not GraphQL/client errors)
 */
export const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error) => {
      // Only retry on network errors, not GraphQL errors
      const isNetworkError = !!error && !error.result;

      // Don't retry 4xx errors (client errors are not transient)
      const statusCode = error?.statusCode;
      const isClientError =
        typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500;

      return isNetworkError && !isClientError;
    },
  },
});
