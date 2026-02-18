/**
 * Connection Heartbeat Hook
 * Periodically monitors router connection status (Epic 0.1, Story 0-1-7)
 */

import { useEffect, useRef } from 'react';

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

  /**
   * Whether heartbeat is enabled
   */
  enabled: true,
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
 * - Only checks when a router is connected
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
  const { state, currentRouterIp, setConnected, setDisconnected } =
    useConnectionStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run heartbeat if we have a connected router
    if (!currentRouterIp || state === 'disconnected') {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start heartbeat monitoring
    const checkConnection = async () => {
      try {
        // Send lightweight request to check connection via router proxy
        // Using system/identity endpoint as it's the lightest RouterOS endpoint
        const result = await makeRouterOSRequest<{ name: string }>(
          currentRouterIp,
          'system/identity',
          { method: 'GET' }
        );

        if (result.success) {
          // Connection successful - get fresh state to avoid stale closure
          const currentState = useConnectionStore.getState().state;
          if (currentState !== 'connected') {
            setConnected();
            console.debug('[Heartbeat] Connection restored');
          }
        } else {
          throw new Error(result.error || 'Connection check failed');
        }
      } catch (error) {
        // Connection failed - get fresh state to avoid stale closure
        const currentState = useConnectionStore.getState().state;
        if (currentState !== 'disconnected') {
          setDisconnected();
          console.debug('[Heartbeat] Connection lost', error);
        }
      }
    };

    // Run initial check
    checkConnection();

    // Set up periodic checks
    intervalRef.current = setInterval(checkConnection, HEARTBEAT_CONFIG.interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentRouterIp, state, setConnected, setDisconnected]);
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
