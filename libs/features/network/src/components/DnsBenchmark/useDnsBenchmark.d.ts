/**
 * DNS Benchmark - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.2
 *
 * @description Provides DNS server benchmarking logic using Apollo Client.
 * Tests all configured DNS servers and returns results sorted by response time.
 * Handles progress animation, error states, and callbacks on completion.
 */
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
export declare function useDnsBenchmark({ deviceId, onSuccess, onError, }: UseDnsBenchmarkOptions): UseDnsBenchmarkReturn;
export {};
//# sourceMappingURL=useDnsBenchmark.d.ts.map