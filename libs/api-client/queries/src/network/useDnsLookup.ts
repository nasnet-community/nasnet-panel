import { useMutation } from '@apollo/client';
import { RUN_DNS_LOOKUP } from './dns-diagnostics.graphql';

/**
 * Hook for performing DNS lookups
 * Executes DNS resolution for a hostname using specified DNS server and record type
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [runLookup, { loading, data, error }] = useDnsLookup();
 *
 * // Perform A record lookup
 * await runLookup({
 *   variables: {
 *     input: {
 *       deviceId: 'router-1',
 *       hostname: 'google.com',
 *       recordType: 'A',
 *       server: '8.8.8.8', // Optional
 *       timeout: 5, // Optional, seconds
 *     },
 *   },
 * });
 * ```
 */
export function useDnsLookup() {
  return useMutation(RUN_DNS_LOOKUP, {
    // No refetchQueries needed - DNS lookups are one-off operations
    // Calling component should handle results display
  });
}
