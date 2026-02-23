/**
 * DNS Benchmark - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.2
 *
 * @description Provides DNS server benchmarking logic using Apollo Client.
 * Tests all configured DNS servers and returns results sorted by response time.
 * Handles progress animation, error states, and callbacks on completion.
 */

import { useCallback, useState, useMemo } from 'react';
import { useDnsBenchmark as useApolloQuery } from '@nasnet/api-client/queries';
import type { DnsBenchmarkResult } from './types';

interface UseDnsBenchmarkOptions {
  /** Device/router ID to run benchmark on */
  deviceId: string;
  /** Callback when benchmark completes successfully */
  onSuccess?: (result: DnsBenchmarkResult) => void;
  /** Callback when benchmark fails */
  onError?: (error: string) => void;
}

interface UseDnsBenchmarkReturn {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  progress: number;
  result: DnsBenchmarkResult | null;
  error: string | undefined;
  runBenchmark: () => Promise<void>;
  reset: () => void;
}

/**
 * Headless hook for DNS Benchmark component
 *
 * Manages benchmark execution state, progress tracking, and error handling.
 * All business logic and state management - presenters are purely UI.
 */
export function useDnsBenchmark({
  deviceId,
  onSuccess,
  onError,
}: UseDnsBenchmarkOptions): UseDnsBenchmarkReturn {
  const [result, setResult] = useState<DnsBenchmarkResult | null>(null);
  const [progress, setProgress] = useState(0);

  const [runBenchmarkQuery, { loading, error: queryError }] = useApolloQuery();

  const runBenchmark = useCallback(async () => {
    setResult(null);
    setProgress(0);

    try {
      // Start progress animation (every 300ms)
      const PROGRESS_INTERVAL_MS = 300;
      const MAX_PROGRESS_WITHOUT_RESULT = 90;

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= MAX_PROGRESS_WITHOUT_RESULT) {
            clearInterval(progressInterval);
            return MAX_PROGRESS_WITHOUT_RESULT;
          }
          return prev + 10;
        });
      }, PROGRESS_INTERVAL_MS);

      const { data, error } = await runBenchmarkQuery({
        variables: { deviceId },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        onError?.(error.message);
        return;
      }

      if (data?.dnsBenchmark) {
        const benchmarkResult = data.dnsBenchmark as DnsBenchmarkResult;
        setResult(benchmarkResult);
        onSuccess?.(benchmarkResult);
      }
    } catch (err) {
      setProgress(0);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to run benchmark';
      onError?.(errorMessage);
    }
  }, [deviceId, runBenchmarkQuery, onSuccess, onError]);

  const reset = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  // Memoize return object for stable references
  return useMemo(
    () => ({
      // State
      isLoading: loading,
      isSuccess: result !== null,
      isError: queryError !== undefined,
      progress,

      // Data
      result,
      error: queryError?.message,

      // Actions
      runBenchmark,
      reset,
    }),
    [loading, result, queryError, progress, runBenchmark, reset]
  );
}
