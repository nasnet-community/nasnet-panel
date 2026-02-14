import { useQuery, useSubscription } from '@apollo/client';
import { useEffect, useState } from 'react';
import {
  GET_BOOT_SEQUENCE_PROGRESS,
  SUBSCRIBE_BOOT_SEQUENCE_EVENTS,
} from './services.graphql';

/**
 * Boot sequence progress state
 */
export interface BootSequenceProgress {
  inProgress: boolean;
  currentLayer?: number;
  totalLayers?: number;
  startedInstances: string[];
  failedInstances: string[];
  remainingInstances: string[];
}

/**
 * Boot sequence event types
 */
export type BootSequenceEventType =
  | 'BOOT_SEQUENCE_STARTED'
  | 'LAYER_STARTED'
  | 'INSTANCE_STARTED'
  | 'INSTANCE_FAILED'
  | 'LAYER_COMPLETED'
  | 'BOOT_SEQUENCE_COMPLETED'
  | 'BOOT_SEQUENCE_FAILED';

/**
 * Boot sequence event from subscription
 */
export interface BootSequenceEvent {
  id: string;
  type: BootSequenceEventType;
  timestamp: string;
  layer?: number;
  instanceIds: string[];
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
}

/**
 * Hook to track boot sequence progress
 *
 * Provides real-time updates via GraphQL subscription for boot sequence events.
 * Tracks progress through dependency layers during system startup.
 *
 * @returns Boot sequence progress data, loading state, error, and latest event
 *
 * @example
 * ```tsx
 * // Monitor boot sequence progress
 * const { progress, latestEvent, loading, error } = useBootSequenceProgress();
 *
 * if (progress?.inProgress) {
 *   console.log(`Boot sequence: Layer ${progress.currentLayer}/${progress.totalLayers}`);
 *   console.log(`Started: ${progress.startedInstances.length}`);
 *   console.log(`Failed: ${progress.failedInstances.length}`);
 *   console.log(`Remaining: ${progress.remainingInstances.length}`);
 * }
 *
 * // Handle latest event
 * useEffect(() => {
 *   if (latestEvent?.type === 'INSTANCE_FAILED') {
 *     toast.error(`Instance failed: ${latestEvent.errorMessage}`);
 *   }
 * }, [latestEvent]);
 * ```
 */
export function useBootSequenceProgress() {
  const [latestEvent, setLatestEvent] = useState<BootSequenceEvent | null>(null);

  // Query for current progress state
  const { data, loading, error, refetch } = useQuery(
    GET_BOOT_SEQUENCE_PROGRESS,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: 0, // Rely on subscription for updates
    }
  );

  // Subscribe to real-time boot sequence events
  const {
    data: subData,
    loading: subLoading,
    error: subError,
  } = useSubscription(SUBSCRIBE_BOOT_SEQUENCE_EVENTS);

  // Update latest event when subscription emits
  useEffect(() => {
    if (subData?.bootSequenceEvents) {
      const event = subData.bootSequenceEvents as BootSequenceEvent;
      setLatestEvent(event);

      // Refetch progress to update state
      refetch();
    }
  }, [subData, refetch]);

  // Fallback polling if subscription is not working
  useEffect(() => {
    if (!subData && !loading && !subError) {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Poll every 5 seconds as fallback

      return () => clearInterval(interval);
    }
  }, [subData, loading, subError, refetch]);

  const progress = data?.bootSequenceProgress as BootSequenceProgress | undefined;

  return {
    progress,
    latestEvent,
    loading: loading || subLoading,
    error: error || subError,
    refetch,
  };
}
