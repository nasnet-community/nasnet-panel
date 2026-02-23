/**
 * useTraceroute Hook
 *
 * Custom React hook for running traceroute diagnostics with real-time progress.
 * Manages traceroute execution lifecycle: start → progress events → completion/cancellation
 * Uses GraphQL mutations to trigger traceroute and subscriptions for streaming hop data.
 *
 * Key features:
 * - Real-time hop discovery via WebSocket subscriptions
 * - Automatic cleanup on unmount (cancels running jobs)
 * - Progress tracking and error handling
 * - Callback hooks for hop discovery, completion, and errors
 *
 * @example
 * ```tsx
 * const { run, cancel, isRunning, hops, progress } = useTraceroute({
 *   deviceId: 'router-1',
 *   onHopDiscovered: (hop) => console.log(`Hop ${hop.hopNumber}:`, hop.address),
 *   onComplete: (result) => console.log('Done:', result),
 * });
 *
 * await run({ target: '8.8.8.8', maxHops: 30 });
 * ```
 */
import type { TracerouteInput, TracerouteHop, TracerouteResult } from '@nasnet/api-client/generated/types';
export interface UseTracerouteOptions {
    /**
     * Router/device ID to run traceroute on
     */
    deviceId: string;
    /**
     * Called when each hop is discovered
     */
    onHopDiscovered?: (hop: TracerouteHop) => void;
    /**
     * Called when traceroute completes successfully
     */
    onComplete?: (result: TracerouteResult) => void;
    /**
     * Called when traceroute encounters an error
     */
    onError?: (error: string) => void;
    /**
     * Called when traceroute is cancelled
     */
    onCancelled?: () => void;
}
export interface UseTracerouteReturn {
    /**
     * Start a traceroute with the given input
     */
    run: (input: TracerouteInput) => Promise<void>;
    /**
     * Cancel the currently running traceroute
     */
    cancel: () => Promise<void>;
    /**
     * Whether a traceroute is currently running
     */
    isRunning: boolean;
    /**
     * Hops discovered so far (accumulated during execution)
     */
    hops: TracerouteHop[];
    /**
     * Final result (available when complete)
     */
    result: TracerouteResult | null;
    /**
     * Error message if traceroute failed
     */
    error: string | null;
    /**
     * Progress percentage (0-100)
     */
    progress: number;
}
/**
 * Hook for running traceroute and subscribing to real-time progress
 *
 * @example
 * ```tsx
 * const { run, cancel, isRunning, hops, result, error } = useTraceroute({
 *   deviceId: router.id,
 *   onComplete: (result) => console.log('Done:', result),
 *   onError: (err) => console.error('Error:', err),
 * });
 *
 * // Start traceroute
 * await run({ target: '8.8.8.8', maxHops: 30 });
 *
 * // Cancel if needed
 * await cancel();
 * ```
 */
export declare function useTraceroute(options: UseTracerouteOptions): UseTracerouteReturn;
//# sourceMappingURL=useTraceroute.d.ts.map