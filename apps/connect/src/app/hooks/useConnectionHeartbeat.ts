/**
 * Connection Heartbeat Hook
 * Periodically monitors router connection status (Epic 0.1, Story 0-1-7)
 */

import { useEffect, useRef, useCallback } from 'react';

import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { useConnectionStore } from '@nasnet/state/stores';

/**
 * Configuration for heartbeat monitoring
 */
const HEARTBEAT_CONFIG = {
  /**
   * Interval between heartbeat checks (30 seconds)
   */
  interval: 30_000,

  /**
   * Timeout for heartbeat requests (5 seconds)
   */
  timeout: 5000,
} as const;

/**
 * Connection Heartbeat Hook
 *
 * Periodically checks router connection by sending lightweight
 * requests to the RouterOS API. Updates connection state based
 * on response.
 *
 * Features:
 * - Runs every 30 seconds
 * - Only checks when a router IP is available
 * - Reads fresh state from store on each tick to avoid stale closures
 * - Updates connection state automatically
 * - Cleans up on unmount
 *
 * @example
 * ```tsx
 * function App() {
 *   // Enable heartbeat monitoring
 *   useConnectionHeartbeat();
 *
 *   return <Router />
 * }
 * ```
 */
export function useConnectionHeartbeat() {
  const currentRouterIp = useConnectionStore((s) => s.currentRouterIp);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable callback that reads fresh store state each invocation
  const checkConnection = useCallback(async (routerIp: string) => {
    try {
      const result = await makeRouterOSRequest<{ name: string }>(
        routerIp,
        'system/identity',
        { method: 'GET' }
      );

      if (result.success) {
        const store = useConnectionStore.getState();
        if (store.state !== 'connected') {
          store.setConnected();
          console.debug('[Heartbeat] Connection restored');
        }
      } else {
        throw new Error(result.error || 'Connection check failed');
      }
    } catch (error) {
      const store = useConnectionStore.getState();
      if (store.state !== 'disconnected') {
        store.setDisconnected();
        console.debug('[Heartbeat] Connection lost', error);
      }
    }
  }, []);

  useEffect(() => {
    // Only run heartbeat if we have a router IP
    if (!currentRouterIp) {
      return;
    }

    // Run initial check
    checkConnection(currentRouterIp);

    // Set up periodic checks
    intervalRef.current = setInterval(
      () => checkConnection(currentRouterIp),
      HEARTBEAT_CONFIG.interval
    );

    // Cleanup on unmount or when router IP changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentRouterIp, checkConnection]);
}

/**
 * Manual connection test function
 * Can be used for on-demand connection checks
 *
 * @param routerIp - Router IP address to test
 * @returns Promise resolving to true if connected, false otherwise
 *
 * @example
 * ```tsx
 * const isConnected = await testConnection('192.168.88.1');
 * if (!isConnected) {
 *   alert('Lost connection to router');
 * }
 * ```
 */
export async function testConnection(routerIp: string): Promise<boolean> {
  if (!routerIp) return false;
  
  try {
    const result = await makeRouterOSRequest<{ name: string }>(
      routerIp,
      'system/identity',
      { method: 'GET' }
    );
    return result.success;
  } catch {
    return false;
  }
}
