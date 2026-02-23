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

import { setup, assign } from 'xstate';
import type { PingResult, PingStatistics } from '../components/PingTool/PingTool.types';
import { calculateStatistics } from '../components/PingTool/ping.utils';

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
 * Events that can be sent to the ping machine
 *
 * @see PingContext for associated data
 */
type PingEvent =
  | { type: 'START'; target: string; count: number }
  | { type: 'JOB_STARTED'; jobId: string }
  | { type: 'RESULT_RECEIVED'; result: PingResult }
  | { type: 'STOP' }
  | { type: 'ERROR'; error: string };

/**
 * Initial statistics object with zero values
 *
 * Used to reset statistics when starting a new ping test.
 * All timing values are null until first result received.
 *
 * @internal
 */
const initialStatistics: PingStatistics = {
  sent: 0,
  received: 0,
  lost: 0,
  lossPercent: 0,
  minRtt: null,
  avgRtt: null,
  maxRtt: null,
  stdDev: null,
};

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
export const pingMachine = setup({
  types: {
    context: {} as PingContext,
    events: {} as PingEvent,
  },
  guards: {
    /**
     * Check if ping test is complete (all expected packets sent)
     *
     * This guard evaluates BEFORE actions, checking if adding the
     * next result would complete the test. When true, the state machine
     * transitions to 'complete' and stops accumulating results.
     *
     * @param context - Current machine context with results array
     * @returns true if all expected pings have been received
     */
    isComplete: ({ context }) => context.results.length + 1 >= context.count,
  },
  actions: {
    /**
     * Initialize context for a new ping test
     *
     * Resets all state including target, count, results, statistics,
     * and error. Called on START event to prepare for fresh test.
     *
     * @internal
     */
    setTarget: assign({
      target: ({ event }) => (event as { type: 'START'; target: string }).target,
      count: ({ event }) => (event as { type: 'START'; count: number }).count,
      results: () => [],
      statistics: () => initialStatistics,
      error: () => null,
      jobId: () => null,
    }),

    /**
     * Store backend job ID for tracking
     *
     * Called when backend confirms job creation. Stores the ID
     * for potential cancellation or progress tracking.
     *
     * @internal
     */
    setJobId: assign({
      jobId: ({ event }) => (event as { type: 'JOB_STARTED'; jobId: string }).jobId,
    }),

    /**
     * Add new ping result to the results array
     *
     * Appends incoming result from subscription. Must run
     * BEFORE updateStatistics action in same transition.
     *
     * @internal
     */
    addResult: assign({
      results: ({ context, event }) => [
        ...context.results,
        (event as { type: 'RESULT_RECEIVED'; result: PingResult }).result,
      ],
    }),

    /**
     * Recalculate statistics based on current results
     *
     * Called after each result added. Computes min/max/avg/stdDev RTT,
     * packet loss, etc. Must run AFTER addResult in transition order.
     *
     * @internal
     */
    updateStatistics: assign({
      statistics: ({ context }) => {
        return calculateStatistics(context.results);
      },
    }),

    /**
     * Store error message from failed test
     *
     * Called on ERROR event. Preserves error reason for display
     * in error state. Error details shown to user in UI.
     *
     * @internal
     */
    setError: assign({
      error: ({ event }) => (event as { type: 'ERROR'; error: string }).error,
    }),
  },
}).createMachine({
  id: 'ping',
  initial: 'idle',
  context: {
    target: '',
    count: 10,
    jobId: null,
    results: [],
    statistics: initialStatistics,
    error: null,
  },
  states: {
    /**
     * Idle state - ready to start a new ping test
     */
    idle: {
      on: {
        START: {
          target: 'running',
          actions: 'setTarget',
        },
      },
    },

    /**
     * Running state - ping test in progress
     *
     * Automatically transitions to complete when isComplete guard passes.
     */
    running: {
      on: {
        START: {
          target: 'running',
          actions: 'setTarget',
        },
        JOB_STARTED: {
          actions: 'setJobId',
        },
        RESULT_RECEIVED: [
          {
            // Check if complete AFTER adding result
            guard: 'isComplete',
            target: 'complete',
            actions: ['addResult', 'updateStatistics'],
          },
          {
            // Stay in running, accumulate result
            actions: ['addResult', 'updateStatistics'],
          },
        ],
        STOP: 'stopped',
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },

    /**
     * Stopped state - user manually stopped the test
     *
     * Results and statistics are preserved.
     */
    stopped: {
      on: {
        START: {
          target: 'running',
          actions: 'setTarget',
        },
      },
    },

    /**
     * Complete state - all pings sent successfully
     *
     * Final results and statistics available in context.
     */
    complete: {
      on: {
        START: {
          target: 'running',
          actions: 'setTarget',
        },
      },
    },

    /**
     * Error state - test failed
     *
     * Error message available in context.error.
     */
    error: {
      on: {
        START: {
          target: 'running',
          actions: 'setTarget',
        },
      },
    },
  },
});
