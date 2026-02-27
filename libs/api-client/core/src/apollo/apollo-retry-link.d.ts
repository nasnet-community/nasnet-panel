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
export declare const retryLink: RetryLink;
//# sourceMappingURL=apollo-retry-link.d.ts.map
