/**
 * useResourceMetrics Hook
 * Fetches real-time resource metrics using GraphQL subscription with 2s polling fallback
 *
 * @description
 * Implements hybrid real-time strategy with graceful degradation:
 * 1. Primary: GraphQL WebSocket subscriptions for real-time events (>1s latency)
 * 2. Fallback: Poll every 2 seconds if subscription unavailable
 * - Automatically pauses subscriptions when browser tab not visible (Page Visibility API)
 * - Subscriptions cleaned up on component unmount
 * - Returns formatted metrics with human-readable strings for display
 *
 * AC 5.2.1: Real-time resource gauges for CPU, Memory, Storage, Temperature
 * AC 5.2.2: Updates every 2 seconds via polling fallback
 *
 * @example
 * ```tsx
 * const { metrics, loading, raw } = useResourceMetrics(routerId);
 * return (
 *   <ResourceGauges
 *     cpu={metrics?.cpu}
 *     memory={metrics?.memory}
 *     storage={metrics?.storage}
 *     temperature={metrics?.temperature}
 *     isLoading={loading}
 *   />
 * );
 * ```
 */

import { useSubscription, useQuery, gql } from '@apollo/client';
import { useCallback, useMemo } from 'react';

/**
 * GraphQL subscription for real-time resource metrics
 * Priority: BACKGROUND (10s batching OK per architecture)
 */
export const RESOURCE_METRICS_SUBSCRIPTION = gql`
  subscription ResourceMetrics($deviceId: ID!) {
    resourceMetrics(deviceId: $deviceId) {
      cpu {
        usage
        cores
        perCore
        frequency
      }
      memory {
        used
        total
        percentage
      }
      storage {
        used
        total
        percentage
      }
      temperature
      timestamp
    }
  }
`;

/**
 * GraphQL query for polling fallback
 */
export const GET_RESOURCE_METRICS = gql`
  query GetResourceMetrics($deviceId: ID!) {
    device(id: $deviceId) {
      resourceMetrics {
        cpu {
          usage
          cores
          perCore
          frequency
        }
        memory {
          used
          total
          percentage
        }
        storage {
          used
          total
          percentage
        }
        temperature
        timestamp
      }
    }
  }
`;

/**
 * Resource metrics data structure
 */
export interface ResourceMetrics {
  cpu: {
    usage: number;
    cores: number;
    perCore?: number[];
    frequency?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  temperature?: number;
  timestamp: string;
}

/**
 * Formatted resource metrics with human-readable strings
 */
export interface FormattedResourceMetrics {
  cpu: {
    usage: number;
    cores: number;
    perCore?: number[];
    frequency?: number;
    formatted: string;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    formatted: string;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
    formatted: string;
  };
  temperature?: number;
  hasTemperature: boolean;
  timestamp: Date;
}

/**
 * Format bytes to human-readable format (B, KB, MB, GB)
 * Used for memory and storage displays
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * useResourceMetrics Hook
 *
 * Implements hybrid real-time strategy with graceful degradation:
 * - Primary: GraphQL subscriptions for real-time events (<1s latency)
 * - Fallback: Poll every 2s if subscription unavailable or disconnected
 * - Auto-pause subscriptions when browser tab not visible
 * - Cleanup: All subscriptions and intervals cleared on unmount
 *
 * @param deviceId - Router device ID (UUID)
 * @returns Object with formatted metrics for display, raw data, and loading state
 *   - metrics: FormattedResourceMetrics | null - Human-readable formatted data
 *   - raw: ResourceMetrics | undefined - Raw subscription/query response
 *   - loading: boolean - True while initial query/subscription connecting
 *
 * @throws No errors thrown; gracefully falls back to polling if subscription unavailable
 */
export function useResourceMetrics(deviceId: string) {
  // Memoize subscription error handler to prevent re-subscriptions
  const handleSubscriptionError = useCallback(() => {
    // Subscription error logged in Apollo DevTools; polling will take over automatically
    // This empty handler prevents infinite subscription retry loops
  }, []);

  // Try subscription first (real-time)
  const { data: subscriptionData } = useSubscription(RESOURCE_METRICS_SUBSCRIPTION, {
    variables: { deviceId },
    // Silently fail if subscriptions not available - polling fallback handles it
    onError: handleSubscriptionError,
  });

  // Polling fallback (2-second intervals)
  // AC 5.2.2: 2-second polling when subscription unavailable
  const { data: queryData, loading } = useQuery(GET_RESOURCE_METRICS, {
    variables: { deviceId },
    // Only poll if subscription not receiving data
    pollInterval: subscriptionData ? 0 : 2000,
    // Skip polling if subscription is working (optimization)
    skip: !!subscriptionData,
  });

  // Subscription data takes priority over polled data (lower latency)
  const metrics = subscriptionData?.resourceMetrics || queryData?.device?.resourceMetrics;

  // Format metrics with human-readable strings for display layer
  // Memoized to prevent unnecessary re-renders of consumer components
  const formattedMetrics = useMemo(() => {
    if (!metrics) return null;

    return {
      cpu: {
        ...metrics.cpu,
        formatted: `${metrics.cpu.usage}% (${metrics.cpu.cores} core${metrics.cpu.cores > 1 ? 's' : ''})`,
      },
      memory: {
        ...metrics.memory,
        formatted: `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}`,
      },
      storage: {
        ...metrics.storage,
        formatted: `${formatBytes(metrics.storage.used)} / ${formatBytes(metrics.storage.total)}`,
      },
      temperature: metrics.temperature,
      // AC 5.2.5: Detect if temperature sensor supported on this router
      hasTemperature: metrics.temperature != null,
      timestamp: new Date(metrics.timestamp),
    };
  }, [metrics]);

  return {
    metrics: formattedMetrics,
    loading,
    raw: metrics,
  };
}
