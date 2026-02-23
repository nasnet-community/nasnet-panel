/* eslint-disable @typescript-eslint/ban-types */
/**
 * Ping Diagnostic XState Machine
 *
 * State machine for managing ping diagnostic workflow with states:
 * - idle: Ready to start a new ping test
 * - running: Ping test in progress, receiving results
 * - stopped: Ping test manually stopped by user
 * - complete: Ping test completed successfully (all packets sent)
 * - error: Ping test failed due to an error
 *
 * Events:
 * - START: Begin a new ping test
 * - JOB_STARTED: Backend job created, store jobId
 * - RESULT_RECEIVED: New ping result received via subscription
 * - STOP: User manually stops the test
 * - ERROR: Test failed with error
 *
 * @example
 * ```tsx
 * const pingActor = useActorRef(pingMachine);
 * pingActor.send({ type: 'START', target: '8.8.8.8', count: 10 });
 * ```
 *
 * @see Docs/architecture/adrs/002-state-management-approach.md
 */
import type { PingResult, PingStatistics } from '../components/PingTool/PingTool.types';
/**
 * Context for ping machine
 *
 * Tracks the state of an active ping diagnostic test including
 * results, statistics, and error state.
 */
interface PingContext {
    /** Target host or IP address to ping (IP or FQDN) */
    target: string;
    /** Number of pings to send (matches ICMP count) */
    count: number;
    /** Backend job ID for tracking and cancellation */
    jobId: string | null;
    /** Array of ping results received so far */
    results: PingResult[];
    /** Calculated statistics (min/max/avg/stdDev RTT) */
    statistics: PingStatistics;
    /** Error message if test failed (null when successful) */
    error: string | null;
}
/**
 * Ping diagnostic state machine
 *
 * Manages the lifecycle of a ping diagnostic test with automatic
 * completion detection and statistics calculation.
 *
 * Features:
 * - Auto-transition to complete when all expected packets received
 * - Real-time statistics calculation after each result
 * - Error handling and user cancellation support
 * - Preserves state across user-initiated stop (not clearing results)
 *
 * @internal
 */
export declare const pingMachine: import("xstate").StateMachine<PingContext, {
    type: "START";
    target: string;
    count: number;
} | {
    type: "JOB_STARTED";
    jobId: string;
} | {
    type: "RESULT_RECEIVED";
    result: PingResult;
} | {
    type: "STOP";
} | {
    type: "ERROR";
    error: string;
}, {}, never, {
    type: "setError";
    params: import("xstate").NonReducibleUnknown;
} | {
    type: "setTarget";
    params: import("xstate").NonReducibleUnknown;
} | {
    type: "setJobId";
    params: import("xstate").NonReducibleUnknown;
} | {
    type: "addResult";
    params: import("xstate").NonReducibleUnknown;
} | {
    type: "updateStatistics";
    params: import("xstate").NonReducibleUnknown;
}, {
    type: "isComplete";
    params: unknown;
}, never, "error" | "running" | "idle" | "complete" | "stopped", string, import("xstate").NonReducibleUnknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
    id: "ping";
    states: {
        readonly idle: {};
        readonly running: {};
        readonly stopped: {};
        readonly complete: {};
        readonly error: {};
    };
}>;
export {};
//# sourceMappingURL=ping-machine.d.ts.map