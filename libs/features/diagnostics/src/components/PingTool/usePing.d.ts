/**
 * usePing Hook - Headless Logic for Ping Diagnostic Tool
 *
 * Integrates XState machine with Apollo Client for ping diagnostics.
 * Manages:
 * - Ping test lifecycle via state machine
 * - GraphQL mutations for starting/stopping
 * - Real-time result streaming via subscriptions
 * - Automatic completion detection
 *
 * @see libs/features/diagnostics/src/machines/ping-machine.ts
 */
import type { PingFormValues } from './ping.schema';
import type { PingResult, PingStatistics } from './PingTool.types';
/**
 * Options for usePing hook
 */
export interface UsePingOptions {
    /** Router/device ID to run ping from */
    deviceId: string;
    /** Callback when ping completes successfully */
    onComplete?: () => void;
    /** Callback when ping fails with error */
    onError?: (error: string) => void;
}
/**
 * Return type for usePing hook
 */
export interface UsePingReturn {
    /** Current machine state value */
    state: string;
    /** Is the machine in idle state */
    isIdle: boolean;
    /** Is the machine in running state */
    isRunning: boolean;
    /** Is the machine in complete state */
    isComplete: boolean;
    /** Is the machine in stopped state */
    isStopped: boolean;
    /** Is the machine in error state */
    isError: boolean;
    /** Array of ping results received so far */
    results: PingResult[];
    /** Calculated statistics */
    statistics: PingStatistics;
    /** Error message if failed */
    error: string | null;
    /** Target host/IP being pinged */
    target: string;
    /** Number of pings configured */
    count: number;
    /** Start a new ping test */
    startPing: (values: PingFormValues) => void;
    /** Stop the current ping test */
    stop: () => void;
    /** Is the start mutation in progress */
    isStarting: boolean;
    /** Is the stop mutation in progress */
    isStopping: boolean;
}
/**
 * Headless hook for ping diagnostic functionality
 *
 * Manages ping test lifecycle using XState machine and Apollo Client.
 * Handles GraphQL mutations and subscriptions for real-time results.
 *
 * **State Management:**
 * - Uses XState machine for coordinated state transitions (idle → running → complete/error)
 * - Apollo Client mutations for starting/stopping ping operations
 * - GraphQL subscriptions for streaming real-time ping results
 * - Auto-calculates statistics from results array
 *
 * **Lifecycle:**
 * 1. User calls `startPing(values)` with target host, ping count, etc.
 * 2. Machine transitions to 'running' and sends RUN_PING mutation
 * 3. Subscription activates and receives PING_RESULTS in real-time
 * 4. Each result triggers machine update via RESULT_RECEIVED event
 * 5. User calls `stop()` or subscription completes → transition to 'complete'
 * 6. onComplete callback fires (if provided)
 *
 * **Errors:**
 * - Mutation/subscription errors fire onError callback (if provided)
 * - Error state persists in `error` field until next startPing
 *
 * @param options - Configuration options (deviceId, callbacks)
 * @returns Hook return object with state, data, and action functions
 *
 * @example
 * ```tsx
 * function PingTool({ deviceId }: { deviceId: string }) {
 *   const ping = usePing({
 *     deviceId,
 *     onComplete: () => console.log('Ping complete!'),
 *     onError: (error) => console.error('Ping failed:', error),
 *   });
 *
 *   return (
 *     <div>
 *       <input {...formBind} />
 *       <button onClick={() => ping.startPing(values)}>Start</button>
 *       {ping.isRunning && <button onClick={ping.stop}>Stop</button>}
 *       <div>{ping.results.length} results received</div>
 *       {ping.statistics.sent > 0 && (
 *         <p>Loss: {ping.statistics.lossPercent}%</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function usePing({ deviceId, onComplete, onError, }: UsePingOptions): UsePingReturn;
//# sourceMappingURL=usePing.d.ts.map