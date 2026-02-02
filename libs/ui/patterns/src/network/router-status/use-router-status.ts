/**
 * Router Status Headless Hook
 *
 * Provides all logic and state for router status display.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type ConnectionStatus,
  type RouterStatusData,
  type UseRouterStatusReturn,
  STATUS_LABELS,
  DEFAULT_MAX_RECONNECT_ATTEMPTS,
} from './types';
import { useRouterStatusSubscription } from './use-router-status-subscription';

// ===== Helper Functions =====

/**
 * Calculate relative time string from a date
 * @param date - The date to calculate relative time from
 * @returns Human-readable relative time string or null
 */
function getRelativeTime(date: Date | null): string | null {
  if (!date) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

// ===== Hook Configuration =====

export interface UseRouterStatusConfig {
  /**
   * Router ID to subscribe to
   */
  routerId: string;

  /**
   * Callback fired when status changes
   */
  onStatusChange?: (status: ConnectionStatus) => void;

  /**
   * Maximum reconnection attempts before requiring manual retry
   * @default 5
   */
  maxReconnectAttempts?: number;
}

// ===== Hook Implementation =====

/**
 * Headless hook for router status state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @param config - Hook configuration
 * @returns Router status state object
 *
 * @example
 * ```tsx
 * function RouterStatusMobile({ routerId }: { routerId: string }) {
 *   const state = useRouterStatus({ routerId });
 *
 *   return (
 *     <div className={state.isOnline ? 'text-success' : 'text-muted-foreground'}>
 *       {state.statusLabel}
 *       {state.data.status === 'CONNECTING' && (
 *         <span>Attempt {state.data.reconnectAttempt} of {state.data.maxReconnectAttempts}</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRouterStatus(config: UseRouterStatusConfig): UseRouterStatusReturn {
  const {
    routerId,
    onStatusChange,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  } = config;

  // Track previous status for change detection
  const previousStatusRef = useRef<ConnectionStatus | null>(null);

  // Local state for reconnection tracking
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to router status changes
  const { event, loading, error } = useRouterStatusSubscription(routerId);

  // Determine current status from subscription or default
  const status: ConnectionStatus = useMemo(() => {
    if (error) return 'ERROR';
    if (!event?.router) return 'DISCONNECTED';
    return event.router.status as ConnectionStatus;
  }, [event, error]);

  // Build router status data
  const data: RouterStatusData = useMemo(() => {
    const router = event?.router;

    return {
      status,
      protocol: (router?.protocol as RouterStatusData['protocol']) ?? null,
      latencyMs: router?.latencyMs ?? null,
      model: router?.model ?? null,
      version: router?.version ?? null,
      uptime: router?.uptime ?? null,
      lastConnected: router?.lastConnected ? new Date(router.lastConnected) : null,
      reconnectAttempt,
      maxReconnectAttempts,
    };
  }, [event, status, reconnectAttempt, maxReconnectAttempts]);

  // Compute derived values
  const isOnline = status === 'CONNECTED';
  const statusLabel = STATUS_LABELS[status];
  const lastSeenRelative = getRelativeTime(data.lastConnected);

  // Handle status changes
  useEffect(() => {
    if (previousStatusRef.current !== null && previousStatusRef.current !== status) {
      // Status changed
      onStatusChange?.(status);

      // Reset reconnect counter on successful connection
      if (status === 'CONNECTED') {
        setReconnectAttempt(0);
        setIsReconnecting(false);
      }
    }

    previousStatusRef.current = status;
  }, [status, onStatusChange]);

  // Update relative time periodically
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!data.lastConnected || status === 'CONNECTED') return;

    // Update every 30 seconds for relative time display
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [data.lastConnected, status]);

  // Action: Refresh status
  const refresh = useCallback(async () => {
    // In a real implementation, this would trigger a GraphQL query refetch
    // For now, we rely on the subscription for real-time updates
    console.log('[RouterStatus] Refresh requested for router:', routerId);
  }, [routerId]);

  // Action: Force reconnect
  const reconnect = useCallback(async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    setReconnectAttempt((prev) => prev + 1);

    // In a real implementation, this would call a GraphQL mutation
    console.log('[RouterStatus] Reconnect requested for router:', routerId);

    // Simulate reconnection delay
    reconnectTimeoutRef.current = setTimeout(() => {
      setIsReconnecting(false);
    }, 3000);
  }, [routerId, isReconnecting]);

  // Action: Disconnect
  const disconnect = useCallback(async () => {
    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsReconnecting(false);

    // In a real implementation, this would call a GraphQL mutation
    console.log('[RouterStatus] Disconnect requested for router:', routerId);
  }, [routerId]);

  // Action: Cancel reconnection
  const cancelReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsReconnecting(false);
    console.log('[RouterStatus] Reconnection cancelled for router:', routerId);
  }, [routerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    data,
    loading,
    error: error ?? null,

    // Computed
    isOnline,
    statusLabel,
    lastSeenRelative,

    // Actions
    refresh,
    reconnect,
    disconnect,
    cancelReconnect,
  };
}
