/**
 * DNS Benchmark - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.2
 *
 * Provides DNS server benchmarking logic using Apollo Client.
 * Tests all configured DNS servers and returns results sorted by response time.
 */

import { useCallback, useState } from 'react';
import { useDnsBenchmark as useApolloQuery } from '@nasnet/api-client/queries';
import type { DnsBenchmarkResult } from './types';

interface UseDnsBenchmarkOptions {
  deviceId: string;
  onSuccess?: (result: DnsBenchmarkResult) => void;
  onError?: (error: string) => void;
}

export function useDnsBenchmark({ deviceId, onSuccess, onError }: UseDnsBenchmarkOptions) {
  const [result, setResult] = useState<DnsBenchmarkResult | null>(null);
  const [progress, setProgress] = useState(0);

  const [runBenchmarkQuery, { loading, error: queryError }] = useApolloQuery();

  const runBenchmark = useCallback(async () => {
    setResult(null);
    setProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to run benchmark';
      onError?.(errorMessage);
    }
  }, [deviceId, runBenchmarkQuery, onSuccess, onError]);

  const reset = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  return {
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
  };
}
