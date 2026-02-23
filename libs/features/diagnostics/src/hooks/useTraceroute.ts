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

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMutation, useSubscription } from '@apollo/client';
import type {
  TracerouteInput,
  TracerouteHop,
  TracerouteResult,
  TracerouteProgressEvent,
  TracerouteEventType,
} from '@nasnet/api-client/generated/types';
import {
  RUN_TRACEROUTE,
  CANCEL_TRACEROUTE,
  TRACEROUTE_PROGRESS_SUBSCRIPTION,
} from '../graphql/traceroute.graphql';

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
export function useTraceroute(options: UseTracerouteOptions): UseTracerouteReturn {
  const { deviceId, onHopDiscovered, onComplete, onError, onCancelled } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [hops, setHops] = useState<TracerouteHop[]>([]);
  const [result, setResult] = useState<TracerouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);

  const maxHopsRef = useRef<number>(30);

  // Mutations
  const [runTracerouteMutation] = useMutation(RUN_TRACEROUTE);
  const [cancelTracerouteMutation] = useMutation(CANCEL_TRACEROUTE);

  /**
   * Handle progress events from subscription (memoized)
   * Processes hop discovery, completion, error, and cancellation events
   */
  const handleProgressEvent = useCallback(
    (event: TracerouteProgressEvent) => {
      const { eventType, hop, result: finalResult, error: errorMsg } = event;

      switch (eventType as TracerouteEventType) {
        case 'HOP_DISCOVERED':
          if (hop) {
            setHops((prev) => {
              // Check if hop already exists (shouldn't happen, but defensive)
              const exists = prev.some((h) => h.hopNumber === hop.hopNumber);
              if (exists) {
                return prev.map((h) => (h.hopNumber === hop.hopNumber ? hop : h));
              }
              const newHops = [...prev, hop].sort((a, b) => a.hopNumber - b.hopNumber);

              // Update progress (memoized calculation)
              setProgress((hop.hopNumber / maxHopsRef.current) * 100);

              return newHops;
            });
            onHopDiscovered?.(hop);
          }
          break;

        case 'COMPLETE':
          if (finalResult) {
            setResult(finalResult);
            setHops([...finalResult.hops]); // Use final authoritative hop list
            setIsRunning(false);
            setProgress(100);
            setJobId(null);
            onComplete?.(finalResult);
          }
          break;

        case 'ERROR':
          setError(errorMsg || 'Traceroute failed');
          setIsRunning(false);
          setJobId(null);
          onError?.(errorMsg || 'Traceroute failed');
          break;

        case 'CANCELLED':
          setIsRunning(false);
          setJobId(null);
          onCancelled?.();
          break;
      }
    },
    [onHopDiscovered, onComplete, onError, onCancelled]
  );

  /**
   * Subscribe to progress events when we have a jobId
   */
  useSubscription(TRACEROUTE_PROGRESS_SUBSCRIPTION, {
    variables: { jobId: jobId || '' },
    skip: !jobId,
    onData: ({ data }) => {
      if (data.data?.tracerouteProgress) {
        handleProgressEvent(data.data.tracerouteProgress);
      }
    },
  });

  /**
   * Start a traceroute
   */
  const run = useCallback(
    async (input: TracerouteInput) => {
      try {
        // Reset state
        setIsRunning(true);
        setHops([]);
        setResult(null);
        setError(null);
        setProgress(0);
        maxHopsRef.current = input.maxHops || 30;

        // Start traceroute
        const { data } = await runTracerouteMutation({
          variables: {
            deviceId,
            input,
          },
        });

        if (data?.runTraceroute?.jobId) {
          setJobId(data.runTraceroute.jobId);
        } else {
          throw new Error('Failed to start traceroute: No job ID returned');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start traceroute';
        setError(errorMsg);
        setIsRunning(false);
        onError?.(errorMsg);
      }
    },
    [deviceId, runTracerouteMutation, onError]
  );

  /**
   * Cancel the running traceroute
   */
  const cancel = useCallback(async () => {
    if (!jobId) return;

    try {
      await cancelTracerouteMutation({
        variables: { jobId },
      });
      // The subscription will receive CANCELLED event
    } catch (err) {
      console.error('Failed to cancel traceroute:', err);
      // Force local cancellation even if API call fails
      setIsRunning(false);
      setJobId(null);
    }
  }, [jobId, cancelTracerouteMutation]);

  /**
   * Cleanup on unmount: cancel running job if still in progress
   */
  useEffect(() => {
    return () => {
      if (jobId && isRunning) {
        cancelTracerouteMutation({ variables: { jobId } }).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [jobId, isRunning, cancelTracerouteMutation]);

  /**
   * Memoize return value for stable reference (prevents unnecessary re-renders)
   */
  const returnValue = useMemo(
    () => ({
      run,
      cancel,
      isRunning,
      hops,
      result,
      error,
      progress,
    }),
    [run, cancel, isRunning, hops, result, error, progress]
  );

  return returnValue;
}
