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
export declare function useDnsBenchmark(): import('@apollo/client').LazyQueryResultTuple<
  any,
  import('@apollo/client').OperationVariables
>;
//# sourceMappingURL=useDnsBenchmark.d.ts.map
