/**
 * WAN Subscription Hook
 *
 * Real-time WAN status and health updates via GraphQL subscriptions.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL subscription for WAN status changes
const WAN_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription WANStatusChanged($routerId: ID!, $wanId: ID) {
    wanStatusChanged(routerId: $routerId, wanId: $wanId) {
      routerId
      wanInterfaceId
      interfaceName
      status
      previousStatus
      connectionType
      publicIP
      gateway
      reason
      changedAt
    }
  }
`;

// GraphQL subscription for WAN health changes
const WAN_HEALTH_CHANGED_SUBSCRIPTION = gql`
  subscription WANHealthChanged($routerId: ID!, $wanId: ID) {
    wanHealthChanged(routerId: $routerId, wanId: $wanId) {
      routerId
      wanInterfaceId
      interfaceName
      healthStatus
      previousHealthStatus
      target
      latency
      packetLoss
      consecutiveFailures
      consecutiveSuccesses
      lastCheckTime
    }
  }
`;

/**
 * WAN Status Change Event
 */
export interface WANStatusChangeEvent {
  routerId: string;
  wanInterfaceId: string;
  interfaceName: string;
  status: string;
  previousStatus: string;
  connectionType: string;
  publicIP?: string;
  gateway?: string;
  reason?: string;
  changedAt: string;
}

/**
 * WAN Health Change Event
 */
export interface WANHealthChangeEvent {
  routerId: string;
  wanInterfaceId: string;
  interfaceName: string;
  healthStatus: string;
  previousHealthStatus: string;
  target: string;
  latency?: number;
  packetLoss: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastCheckTime: string;
}

/**
 * Options for useWANStatusSubscription hook
 */
export interface UseWANStatusSubscriptionOptions {
  routerId: string;
  wanId?: string;
  onStatusChange?: (event: WANStatusChangeEvent) => void;
  skip?: boolean;
}

/**
 * Options for useWANHealthSubscription hook
 */
export interface UseWANHealthSubscriptionOptions {
  routerId: string;
  wanId?: string;
  onHealthChange?: (event: WANHealthChangeEvent) => void;
  skip?: boolean;
}

/**
 * Hook to subscribe to WAN status changes
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useWANStatusSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onStatusChange: (event) => {
 *     console.log('Status changed:', event.status);
 *     // Update UI, show notification, etc.
 *   },
 * });
 * ```
 */
export function useWANStatusSubscription({
  routerId,
  wanId,
  onStatusChange,
  skip = false,
}: UseWANStatusSubscriptionOptions) {
  const onStatusChangeRef = useRef(onStatusChange);

  // Update ref when callback changes
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const { data, loading, error } = useSubscription<{
    wanStatusChanged: WANStatusChangeEvent;
  }>(WAN_STATUS_CHANGED_SUBSCRIPTION, {
    variables: { routerId, wanId },
    skip,
    onData: ({ data: subData }) => {
      if (subData?.data?.wanStatusChanged && onStatusChangeRef.current) {
        onStatusChangeRef.current(subData.data.wanStatusChanged);
      }
    },
  });

  return {
    data: data?.wanStatusChanged,
    loading,
    error,
  };
}

/**
 * Hook to subscribe to WAN health changes
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useWANHealthSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onHealthChange: (event) => {
 *     if (event.healthStatus === 'DOWN') {
 *       showNotification('WAN connection is down!');
 *     }
 *   },
 * });
 * ```
 */
export function useWANHealthSubscription({
  routerId,
  wanId,
  onHealthChange,
  skip = false,
}: UseWANHealthSubscriptionOptions) {
  const onHealthChangeRef = useRef(onHealthChange);

  // Update ref when callback changes
  useEffect(() => {
    onHealthChangeRef.current = onHealthChange;
  }, [onHealthChange]);

  const { data, loading, error } = useSubscription<{
    wanHealthChanged: WANHealthChangeEvent;
  }>(WAN_HEALTH_CHANGED_SUBSCRIPTION, {
    variables: { routerId, wanId },
    skip,
    onData: ({ data: subData }) => {
      if (subData?.data?.wanHealthChanged && onHealthChangeRef.current) {
        onHealthChangeRef.current(subData.data.wanHealthChanged);
      }
    },
  });

  return {
    data: data?.wanHealthChanged,
    loading,
    error,
  };
}

/**
 * Combined hook for both status and health subscriptions
 *
 * @example
 * ```tsx
 * const { status, health } = useWANSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onStatusChange: (event) => console.log('Status:', event.status),
 *   onHealthChange: (event) => console.log('Health:', event.healthStatus),
 * });
 * ```
 */
export function useWANSubscription({
  routerId,
  wanId,
  onStatusChange,
  onHealthChange,
  skip = false,
}: UseWANStatusSubscriptionOptions & UseWANHealthSubscriptionOptions) {
  const statusSub = useWANStatusSubscription({
    routerId,
    wanId,
    onStatusChange,
    skip,
  });

  const healthSub = useWANHealthSubscription({
    routerId,
    wanId,
    onHealthChange,
    skip,
  });

  return {
    status: statusSub,
    health: healthSub,
  };
}

/**
 * Health status badge color helper
 */
export const getHealthStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'HEALTHY':
      return 'success';
    case 'DEGRADED':
      return 'warning';
    case 'DOWN':
      return 'error';
    case 'UNKNOWN':
    default:
      return 'muted';
  }
};

/**
 * Connection status badge color helper
 */
export const getConnectionStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'CONNECTED':
      return 'success';
    case 'CONNECTING':
      return 'warning';
    case 'DISCONNECTED':
    case 'ERROR':
      return 'error';
    case 'DISABLED':
    default:
      return 'muted';
  }
};
