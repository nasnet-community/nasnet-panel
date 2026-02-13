import { useLazyQuery } from '@apollo/client';
import { RUN_DNS_BENCHMARK } from './dns-diagnostics.graphql';

/**
 * Hook for running DNS server benchmarks
 * Tests all configured DNS servers and returns response times sorted from fastest to slowest
 *
 * @returns Lazy query function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [runBenchmark, { loading, data, error }] = useDnsBenchmark();
 *
 * // Run benchmark on button click
 * const handleBenchmark = async () => {
 *   await runBenchmark({
 *     variables: {
 *       deviceId: 'router-1',
 *     },
 *   });
 * };
 * ```
 */
export function useDnsBenchmark() {
  return useLazyQuery(RUN_DNS_BENCHMARK, {
    fetchPolicy: 'network-only', // Always get fresh benchmark results
    // No caching needed - benchmarks should always be fresh
  });
}
