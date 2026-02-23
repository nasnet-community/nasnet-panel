/**
 * useRouterStatusSubscription Hook
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Apollo Client subscription hook for real-time router status updates.
 * Provides WebSocket-based live updates with auto-reconnect.
 *
 * Performance SLA: <2 seconds end-to-end latency (router event → UI update)
 * - Subscription latency: <100ms (backend → WebSocket)
 * - Cache update: <500ms (WebSocket → Apollo cache)
 * - UI render: <500ms (cache → React re-render)
 *
 * @see Story 2.6: GraphQL Subscriptions (Backend)
 * @see Story 4.4: Apollo Client Setup
 */

import { useSubscription, gql } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';

// TODO (Task 4): Import generated types from GraphQL codegen
// import { OnRouterStatusChangedSubscription, OnRouterStatusChangedSubscriptionVariables } from '@nasnet/api-client/generated';

// GraphQL subscription (will be replaced by codegen)
const ON_ROUTER_STATUS_CHANGED = gql`
  subscription OnRouterStatusChanged($routerId: ID!) {
    routerStatusChanged(routerId: $routerId) {
      uuid
      runtime {
        status
        cpuUsage
        memoryUsage
        activeConnections
        lastUpdate
        temperature
      }
    }
  }
`;

export interface UseRouterStatusSubscriptionOptions {
  /** Router UUID to subscribe to */
  routerId: string;
  /** Skip subscription (disable WebSocket) */
  skip?: boolean;
  /** Callback when subscription receives update */
  onData?: (data: any) => void;
  /** Callback when subscription encounters error */
  onError?: (error: Error) => void;
}

const SUBSCRIPTION_TIMEOUT = 30000; // 30 seconds without message = stale

/**
 * @description Subscribe to real-time router status updates via WebSocket subscription.
 * Monitors subscription health and falls back to polling when stale. Automatically
 * cleans up subscriptions and timers on unmount to prevent memory leaks.
 *
 * Features:
 * - WebSocket-based live updates via Apollo Client subscription
 * - Auto-reconnect on connection drop
 * - Subscription health monitoring with timeout detection
 * - Automatic fallback to polling when WebSocket stale (>30 seconds without message)
 * - Stable callback references with useCallback
 * - Cleanup on unmount: clears timeout timer and manages subscription lifecycle
 *
 * @example
 * ```tsx
 * function RouterHealthCard({ routerId }: Props) {
 *   const {
 *     data,
 *     loading,
 *     error,
 *     isSubscriptionHealthy
 *   } = useRouterStatusSubscription({ routerId });
 *
 *   // Activate polling fallback if subscription drops
 *   const pollInterval = isSubscriptionHealthy ? 0 : 10000;
 *
 *   return <Card>...</Card>;
 * }
 * ```
 *
 * @see Apollo Client subscriptions: {@link https://www.apollographql.com/docs/react/data/subscriptions/}
 * @see Story 2.6: GraphQL Subscriptions (Backend)
 * @see Story 4.4: Apollo Client Setup
 */
export function useRouterStatusSubscription({
  routerId,
  skip = false,
  onData,
  onError,
}: UseRouterStatusSubscriptionOptions) {
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
  const [isSubscriptionHealthy, setSubscriptionHealthy] = useState<boolean>(true);
  const healthCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize callbacks to ensure stable references (prevents subscription re-trigger)
  const handleData = useCallback(
    (options: any) => {
      setLastMessageTime(Date.now());
      setSubscriptionHealthy(true);
      onData?.(options.data);
    },
    [onData]
  );

  const handleError = useCallback(
    (error: Error) => {
      console.error('Router status subscription error:', error);
      setSubscriptionHealthy(false);
      onError?.(error);
    },
    [onError]
  );

  const subscription = useSubscription(ON_ROUTER_STATUS_CHANGED, {
    variables: { routerId },
    skip,
    onData: handleData,
    onError: handleError,
    context: {
      headers: {
        'X-Router-Id': routerId,
      },
    },
  });

  // Monitor subscription health and cleanup on unmount
  // If no message received in SUBSCRIPTION_TIMEOUT, mark as stale
  useEffect(() => {
    if (skip) return;

    // Clear any existing timer
    if (healthCheckTimerRef.current) {
      clearInterval(healthCheckTimerRef.current);
    }

    healthCheckTimerRef.current = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTime;

      if (timeSinceLastMessage > SUBSCRIPTION_TIMEOUT) {
        console.warn(
          `Subscription stale: No message in ${SUBSCRIPTION_TIMEOUT}ms. Falling back to polling.`
        );
        setSubscriptionHealthy(false);
      }
    }, SUBSCRIPTION_TIMEOUT);

    // Cleanup: Clear timer on unmount or when dependencies change
    return () => {
      if (healthCheckTimerRef.current) {
        clearInterval(healthCheckTimerRef.current);
        healthCheckTimerRef.current = null;
      }
    };
  }, [lastMessageTime, skip]);

  return {
    ...subscription,
    isSubscriptionHealthy,
  };
}
