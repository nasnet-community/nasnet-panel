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
 * @see Docs/architecture/adrs/002-state-management-approach.md
 */

import { setup, assign } from 'xstate';
import type { PingResult, PingStatistics } from '../components/PingTool/PingTool.types';
import { calculateStatistics } from '../components/PingTool/ping.utils';

/**
 * Context for ping machine
 */
interface PingContext {
  /** Target host or IP address */
  target: string;
  /** Number of pings to send */
  count: number;
  /** Backend job ID for tracking */
  jobId: string | null;
  /** Array of ping results */
  results: PingResult[];
  /** Calculated statistics */
  statistics: PingStatistics;
  /** Error message if failed */
  error: string | null;
}

/**
 * Events that can be sent to the ping machine
 */
type PingEvent =
  | { type: 'START'; target: string; count: number }
  | { type: 'JOB_STARTED'; jobId: string }
  | { type: 'RESULT_RECEIVED'; result: PingResult }
  | { type: 'STOP' }
  | { type: 'ERROR'; error: string };

/**
 * Initial statistics with no data
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
 */
export const pingMachine = setup({
  types: {
    context: {} as PingContext,
    events: {} as PingEvent,
  },
  guards: {
    /**
     * Check if ping test is complete (all packets sent)
     * Note: Guard evaluates BEFORE actions, so we check if we're ABOUT TO complete
     */
    isComplete: ({ context }) => context.results.length + 1 >= context.count,
  },
  actions: {
    /**
     * Initialize context for new ping test
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
     * Store backend job ID
     */
    setJobId: assign({
      jobId: ({ event }) => (event as { type: 'JOB_STARTED'; jobId: string }).jobId,
    }),

    /**
     * Add new result to results array
     */
    addResult: assign({
      results: ({ context, event }) => [
        ...context.results,
        (event as { type: 'RESULT_RECEIVED'; result: PingResult }).result,
      ],
    }),

    /**
     * Recalculate statistics based on current results
     * Note: Must run AFTER addResult action
     */
    updateStatistics: assign({
      statistics: ({ context }) => {
        return calculateStatistics(context.results);
      },
    }),

    /**
     * Store error message
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
