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

import { useMutation, useSubscription } from '@apollo/client';
import { useMachine } from '@xstate/react';
import { useMemo, useEffect } from 'react';
import { pingMachine } from '../../machines/ping-machine';
import { RUN_PING, STOP_PING, PING_RESULTS } from './ping.graphql';
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
  // State
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

  // Data
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

  // Actions
  /** Start a new ping test */
  startPing: (values: PingFormValues) => void;
  /** Stop the current ping test */
  stop: () => void;

  // Loading states
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
export function usePing({
  deviceId,
  onComplete,
  onError,
}: UsePingOptions): UsePingReturn {
  // Use XState machine with React integration
  const [snapshot, send] = useMachine(pingMachine);

  // GraphQL mutation to start ping
  const [runPingMutation, { loading: isStarting }] = useMutation(RUN_PING, {
    onCompleted: (data) => {
      send({ type: 'JOB_STARTED', jobId: data.runPing.jobId });
    },
    onError: (apolloError) => {
      const errorMessage = apolloError.message || 'Failed to start ping';
      send({ type: 'ERROR', error: errorMessage });
      onError?.(errorMessage);
    },
  });

  // GraphQL mutation to stop ping
  const [stopPingMutation, { loading: isStopping }] = useMutation(STOP_PING, {
    onError: (apolloError) => {
      console.error('Failed to stop ping:', apolloError);
    },
  });

  // GraphQL subscription for streaming results
  useSubscription(PING_RESULTS, {
    variables: { jobId: snapshot.context.jobId },
    skip: !snapshot.context.jobId || !snapshot.matches('running'),
    onData: ({ data }) => {
      if (data?.data?.pingResults) {
        const result = data.data.pingResults;
        // Convert timestamp string to Date if needed
        const parsedResult: PingResult = {
          ...result,
          timestamp:
            typeof result.timestamp === 'string'
              ? new Date(result.timestamp)
              : result.timestamp,
        };
        send({ type: 'RESULT_RECEIVED', result: parsedResult });
      }
    },
    onComplete: () => {
      // Subscription completed (server closed it)
      if (snapshot.matches('running')) {
        // If we're still running, transition to complete
        send({ type: 'STOP' });
      }
    },
    onError: (subscriptionError) => {
      const errorMessage =
        subscriptionError.message || 'Subscription error occurred';
      send({ type: 'ERROR', error: errorMessage });
      onError?.(errorMessage);
    },
  });

  // Call onComplete callback when transitioning to complete state
  useEffect(() => {
    if (snapshot.matches('complete')) {
      onComplete?.();
    }
  }, [snapshot.value, onComplete]);

  /**
   * Start a new ping test
   * Resets state and sends mutation to backend
   */
  const startPing = useMemo(
    () => (values: PingFormValues) => {
      // Send START event to machine first (resets context)
      send({ type: 'START', target: values.target, count: values.count });

      // Then trigger GraphQL mutation
      runPingMutation({
        variables: {
          input: {
            deviceId,
            target: values.target,
            count: values.count,
            size: values.size,
            timeout: values.timeout,
            sourceInterface: values.sourceInterface,
          },
        },
      });
    },
    [deviceId, send, runPingMutation]
  );

  /**
   * Stop the current ping test
   * Sends STOP mutation and transitions state to stopped/complete
   */
  const stop = useMemo(
    () => () => {
      if (snapshot.context.jobId) {
        stopPingMutation({ variables: { jobId: snapshot.context.jobId } });
      }
      send({ type: 'STOP' });
    },
    [snapshot.context.jobId, send, stopPingMutation]
  );

  return {
    // State
    state: String(snapshot.value),
    isIdle: snapshot.matches('idle'),
    isRunning: snapshot.matches('running'),
    isComplete: snapshot.matches('complete'),
    isStopped: snapshot.matches('stopped'),
    isError: snapshot.matches('error'),

    // Data
    results: snapshot.context.results,
    statistics: snapshot.context.statistics,
    error: snapshot.context.error,
    target: snapshot.context.target,
    count: snapshot.context.count,

    // Actions
    startPing,
    stop,

    // Loading states
    isStarting,
    isStopping,
  };
}
