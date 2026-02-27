/**
 * VPN Connection Machine (Feature-Specific Example)
 *
 * State machine for managing VPN connection lifecycle.
 * Handles connection, disconnection, reconnection, and metrics.
 *
 * States:
 * - disconnected: Not connected to VPN
 * - connecting: Establishing connection (30s timeout)
 * - connected: Active VPN connection, receiving metrics
 * - reconnecting: Attempting reconnection after connection loss
 * - disconnecting: Gracefully closing connection
 * - error: Connection error (with retry option)
 *
 * Features:
 * - Connection timeout (30 seconds)
 * - Automatic reconnection with exponential backoff
 * - Real-time metrics updates
 * - Graceful disconnection
 *
 * This is an example implementation. In production, this would
 * be located in libs/features/vpn/src/machines/.
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { useCallback } from 'react';

import { useMachine } from '@xstate/react';
import { setup, assign, fromPromise } from 'xstate';

import type { VPNConnectionContext, VPNConnectionEvent, ConnectionMetrics } from './types';

// ===== Configuration =====

/**
 * Connection timeout in milliseconds
 */
const CONNECTION_TIMEOUT_MS = 30000;

/**
 * Reconnection timeout in milliseconds
 */
const RECONNECTION_TIMEOUT_MS = 10000;

/**
 * Maximum reconnection attempts before giving up
 */
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff (ms)
 */
const BACKOFF_BASE_MS = 1000;

// ===== Service Types =====

/**
 * Connection service input
 */
interface ConnectInput {
  serverAddress: string;
  provider: string;
  attempt?: number;
}

/**
 * Connection result
 */
interface ConnectResult {
  connectionId: string;
}

// ===== Factory Function =====

/**
 * VPN connection services configuration
 */
export interface VPNConnectionServices {
  /**
   * Establish VPN connection
   */
  establishConnection: (params: ConnectInput) => Promise<ConnectResult>;

  /**
   * Attempt to reconnect
   */
  attemptReconnect: (params: ConnectInput) => Promise<ConnectResult>;

  /**
   * Close VPN connection
   */
  closeConnection: (connectionId: string) => Promise<void>;
}

/**
 * Create a VPN connection machine
 *
 * @param services - VPN connection services
 * @returns XState machine for VPN connection
 *
 * @example
 * ```tsx
 * const vpnMachine = createVPNConnectionMachine({
 *   establishConnection: async ({ serverAddress, provider }) => {
 *     const result = await api.connectVPN(serverAddress, provider);
 *     return { connectionId: result.id };
 *   },
 *   attemptReconnect: async ({ serverAddress, provider }) => {
 *     const result = await api.reconnectVPN(serverAddress, provider);
 *     return { connectionId: result.id };
 *   },
 *   closeConnection: async (connectionId) => {
 *     await api.disconnectVPN(connectionId);
 *   },
 * });
 *
 * // Usage in component
 * const [state, send] = useMachine(vpnMachine);
 *
 * // Connect
 * send({ type: 'CONNECT', serverAddress: 'vpn.example.com', provider: 'wireguard' });
 *
 * // Disconnect
 * send({ type: 'DISCONNECT' });
 * ```
 */
export function createVPNConnectionMachine(services: VPNConnectionServices) {
  return setup({
    types: {} as {
      context: VPNConnectionContext;
      events: VPNConnectionEvent;
    },
    actors: {
      establishConnection: fromPromise<ConnectResult, ConnectInput>(async ({ input }) => {
        return services.establishConnection(input);
      }),
      attemptReconnect: fromPromise<ConnectResult, ConnectInput>(async ({ input }) => {
        // Exponential backoff delay
        const delay = BACKOFF_BASE_MS * Math.pow(2, input.attempt || 0);
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 8000)));
        return services.attemptReconnect(input);
      }),
      closeConnection: fromPromise<void, string>(async ({ input }) => {
        return services.closeConnection(input);
      }),
    },
    guards: {
      canReconnect: ({ context }) => {
        return context.reconnectAttempts < context.maxReconnectAttempts;
      },
      hasConnectionId: ({ context }) => {
        return context.connectionId !== null;
      },
    },
    actions: {
      setConnecting: assign({
        serverAddress: ({ event }) => {
          if (event.type === 'CONNECT') {
            return event.serverAddress;
          }
          return null;
        },
        provider: ({ event }) => {
          if (event.type === 'CONNECT') {
            return event.provider;
          }
          return null;
        },
        error: () => null,
        reconnectAttempts: () => 0,
      }),
      setConnected: assign({
        connectionId: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'connectionId' in event.output
          ) {
            return (event.output as ConnectResult).connectionId;
          }
          return null;
        },
        error: () => null,
        reconnectAttempts: () => 0,
      }),
      updateMetrics: assign({
        metrics: ({ event }) => {
          if (event.type === 'METRICS_UPDATE') {
            return event.metrics;
          }
          return null;
        },
      }),
      setError: assign({
        error: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'error' in event &&
            event.error instanceof Error
          ) {
            return event.error.message;
          }
          return 'Connection failed';
        },
      }),
      setTimeoutError: assign({
        error: () => 'Connection timeout',
      }),
      incrementReconnectAttempts: assign({
        reconnectAttempts: ({ context }) => context.reconnectAttempts + 1,
      }),
      clearConnection: assign({
        connectionId: () => null,
        metrics: () => null,
        serverAddress: () => null,
        provider: () => null,
      }),
      clearError: assign({
        error: () => null,
      }),
    },
    delays: {
      CONNECTION_TIMEOUT: CONNECTION_TIMEOUT_MS,
      RECONNECTION_TIMEOUT: RECONNECTION_TIMEOUT_MS,
    },
  }).createMachine({
    id: 'vpnConnection',
    initial: 'disconnected',
    context: {
      connectionId: null,
      provider: null,
      serverAddress: null,
      metrics: null,
      error: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    },
    states: {
      disconnected: {
        description: 'Not connected to VPN',
        entry: 'clearConnection',
        on: {
          CONNECT: {
            target: 'connecting',
            actions: 'setConnecting',
          },
        },
      },
      connecting: {
        description: 'Establishing VPN connection',
        invoke: {
          src: 'establishConnection',
          input: ({ context }) => ({
            serverAddress: context.serverAddress!,
            provider: context.provider!,
          }),
          onDone: {
            target: 'connected',
            actions: 'setConnected',
          },
          onError: {
            target: 'error',
            actions: 'setError',
          },
        },
        after: {
          CONNECTION_TIMEOUT: {
            target: 'error',
            actions: 'setTimeoutError',
          },
        },
      },
      connected: {
        description: 'Active VPN connection',
        on: {
          DISCONNECT: 'disconnecting',
          METRICS_UPDATE: {
            actions: 'updateMetrics',
          },
          CONNECTION_LOST: {
            target: 'reconnecting',
            actions: 'incrementReconnectAttempts',
          },
        },
      },
      reconnecting: {
        description: 'Attempting to reconnect',
        invoke: {
          src: 'attemptReconnect',
          input: ({ context }) => ({
            serverAddress: context.serverAddress!,
            provider: context.provider!,
            attempt: context.reconnectAttempts,
          }),
          onDone: {
            target: 'connected',
            actions: 'setConnected',
          },
          onError: [
            {
              target: 'reconnecting',
              guard: 'canReconnect',
              actions: 'incrementReconnectAttempts',
            },
            {
              target: 'disconnected',
            },
          ],
        },
        after: {
          RECONNECTION_TIMEOUT: 'disconnected',
        },
      },
      disconnecting: {
        description: 'Gracefully closing connection',
        invoke: {
          src: 'closeConnection',
          input: ({ context }) => context.connectionId!,
          onDone: 'disconnected',
          onError: 'disconnected', // Force disconnect on error
        },
      },
      error: {
        description: 'Connection error',
        on: {
          RETRY: {
            target: 'connecting',
            actions: 'clearError',
          },
          DISMISS: 'disconnected',
        },
      },
    },
  });
}

// ===== React Hook =====

/**
 * Return type for useVPNConnection hook
 */
export interface UseVPNConnectionReturn {
  /**
   * Current connection state
   */
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'disconnecting' | 'error';

  /**
   * Connection ID (if connected)
   */
  connectionId: string | null;

  /**
   * Provider name
   */
  provider: string | null;

  /**
   * Server address
   */
  serverAddress: string | null;

  /**
   * Real-time metrics
   */
  metrics: ConnectionMetrics | null;

  /**
   * Error message (if in error state)
   */
  error: string | null;

  /**
   * Reconnection attempt count
   */
  reconnectAttempts: number;

  /**
   * Whether connected
   */
  isConnected: boolean;

  /**
   * Whether connecting or reconnecting
   */
  isConnecting: boolean;

  /**
   * Whether in error state
   */
  isError: boolean;

  /**
   * Connect to VPN
   */
  connect: (serverAddress: string, provider: string) => void;

  /**
   * Disconnect from VPN
   */
  disconnect: () => void;

  /**
   * Retry connection after error
   */
  retry: () => void;

  /**
   * Dismiss error
   */
  dismissError: () => void;

  /**
   * Update metrics (for subscription data)
   */
  updateMetrics: (metrics: ConnectionMetrics) => void;

  /**
   * Report connection lost (triggers reconnection)
   */
  reportConnectionLost: () => void;
}

/**
 * React hook for VPN connection machine
 *
 * @param services - VPN connection services
 * @returns VPN connection state and actions
 *
 * @example
 * ```tsx
 * function VPNStatus() {
 *   const vpn = useVPNConnection({
 *     establishConnection: api.connectVPN,
 *     attemptReconnect: api.reconnectVPN,
 *     closeConnection: api.disconnectVPN,
 *   });
 *
 *   return (
 *     <div>
 *       <StatusBadge status={vpn.state} />
 *       {vpn.isConnected && (
 *         <MetricsDisplay metrics={vpn.metrics} />
 *       )}
 *       {vpn.isError && (
 *         <ErrorMessage error={vpn.error} onRetry={vpn.retry} />
 *       )}
 *       <Button
 *         onClick={() =>
 *           vpn.isConnected
 *             ? vpn.disconnect()
 *             : vpn.connect('vpn.example.com', 'wireguard')
 *         }
 *       >
 *         {vpn.isConnected ? 'Disconnect' : 'Connect'}
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVPNConnection(services: VPNConnectionServices): UseVPNConnectionReturn {
  const machine = createVPNConnectionMachine(services);
  const [state, send] = useMachine(machine);

  const currentState = (
    typeof state.value === 'string' ?
      state.value
    : Object.keys(state.value)[0]) as UseVPNConnectionReturn['state'];

  const connect = useCallback(
    (serverAddress: string, provider: string) => {
      send({ type: 'CONNECT', serverAddress, provider });
    },
    [send]
  );

  const disconnect = useCallback(() => {
    send({ type: 'DISCONNECT' });
  }, [send]);

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const dismissError = useCallback(() => {
    send({ type: 'DISMISS' });
  }, [send]);

  const updateMetrics = useCallback(
    (metrics: ConnectionMetrics) => {
      send({ type: 'METRICS_UPDATE', metrics });
    },
    [send]
  );

  const reportConnectionLost = useCallback(() => {
    send({ type: 'CONNECTION_LOST' });
  }, [send]);

  return {
    state: currentState,
    connectionId: state.context.connectionId,
    provider: state.context.provider,
    serverAddress: state.context.serverAddress,
    metrics: state.context.metrics,
    error: state.context.error,
    reconnectAttempts: state.context.reconnectAttempts,
    isConnected: currentState === 'connected',
    isConnecting: currentState === 'connecting' || currentState === 'reconnecting',
    isError: currentState === 'error',
    connect,
    disconnect,
    retry,
    dismissError,
    updateMetrics,
    reportConnectionLost,
  };
}
