/**
 * Connection Indicator Headless Hook
 *
 * Provides all logic and state for connection status display.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */

import { shallow } from 'zustand/shallow';

import { useConnectionStore } from '@nasnet/state/stores';

// ===== Types =====

/**
 * Status color variants
 */
export type StatusColor = 'green' | 'amber' | 'red' | 'gray';

/**
 * Connection indicator state returned by the hook
 */
export interface ConnectionIndicatorState {
  /**
   * Current WebSocket status
   */
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

  /**
   * Human-readable status label
   */
  statusLabel: string;

  /**
   * Semantic color for the status
   */
  statusColor: StatusColor;

  /**
   * Whether currently attempting to reconnect
   */
  isReconnecting: boolean;

  /**
   * Number of reconnection attempts made
   */
  reconnectAttempts: number;

  /**
   * Maximum allowed reconnection attempts
   */
  maxReconnectAttempts: number;

  /**
   * Whether to show manual retry button
   */
  showManualRetry: boolean;

  /**
   * Active router ID (if any)
   */
  activeRouterId: string | null;

  /**
   * Protocol in use for active router
   */
  protocol: 'rest' | 'api' | 'ssh' | null;

  /**
   * Current latency in milliseconds (null if unknown)
   */
  latencyMs: number | null;

  /**
   * Latency quality level
   */
  latencyQuality: 'good' | 'moderate' | 'poor' | null;

  /**
   * Last connected timestamp (formatted string)
   */
  lastConnectedText: string | null;

  /**
   * Callback to trigger manual reconnection
   */
  onRetry: () => void;
}

// ===== Constants =====

/**
 * Latency thresholds in milliseconds
 */
const LATENCY_THRESHOLDS = {
  GOOD: 100, // < 100ms = good (green)
  MODERATE: 300, // < 300ms = moderate (amber)
  // > 300ms = poor (red)
};

/**
 * Status label mapping
 */
const STATUS_LABELS: Record<string, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Connection Error',
};

/**
 * Status color mapping
 */
const STATUS_COLORS: Record<string, StatusColor> = {
  connecting: 'amber',
  connected: 'green',
  disconnected: 'gray',
  error: 'red',
};

// ===== Hook Implementation =====

/**
 * Headless hook for connection indicator state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * Usage:
 * ```tsx
 * function ConnectionIndicatorMobile() {
 *   const state = useConnectionIndicator();
 *
 *   return (
 *     <div className={`status-${state.statusColor}`}>
 *       {state.statusLabel}
 *       {state.showManualRetry && (
 *         <button onClick={state.onRetry}>Retry</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Connection indicator state object
 */
export function useConnectionIndicator(): ConnectionIndicatorState {
  // Select state with shallow comparison for performance
  const {
    wsStatus,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    activeRouterId,
    routers,
    lastConnectedAt,
  } = useConnectionStore(
    (state) => ({
      wsStatus: state.wsStatus,
      isReconnecting: state.isReconnecting,
      reconnectAttempts: state.reconnectAttempts,
      maxReconnectAttempts: state.maxReconnectAttempts,
      activeRouterId: state.activeRouterId,
      routers: state.routers,
      lastConnectedAt: state.lastConnectedAt,
    }),
    shallow
  );

  // Get active router connection info
  const activeConnection = activeRouterId ? routers[activeRouterId] : null;

  // Get reset action
  const resetReconnection = useConnectionStore((state) => state.resetReconnection);

  // Derive status label and color
  const statusLabel = STATUS_LABELS[wsStatus] || 'Unknown';
  const statusColor = STATUS_COLORS[wsStatus] || 'gray';

  // Calculate whether to show manual retry
  const showManualRetry = reconnectAttempts >= maxReconnectAttempts;

  // Get protocol and latency from active connection
  const protocol = activeConnection?.protocol ?? null;
  const latencyMs = activeConnection?.latencyMs ?? null;

  // Calculate latency quality
  let latencyQuality: 'good' | 'moderate' | 'poor' | null = null;
  if (latencyMs !== null) {
    if (latencyMs < LATENCY_THRESHOLDS.GOOD) {
      latencyQuality = 'good';
    } else if (latencyMs < LATENCY_THRESHOLDS.MODERATE) {
      latencyQuality = 'moderate';
    } else {
      latencyQuality = 'poor';
    }
  }

  // Format last connected time
  let lastConnectedText: string | null = null;
  if (lastConnectedAt && wsStatus === 'connected') {
    lastConnectedText = `Last connected: ${lastConnectedAt.toLocaleTimeString()}`;
  }

  return {
    wsStatus,
    statusLabel,
    statusColor,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    showManualRetry,
    activeRouterId,
    protocol,
    latencyMs,
    latencyQuality,
    lastConnectedText,
    onRetry: resetReconnection,
  };
}

// ===== Type Exports =====
