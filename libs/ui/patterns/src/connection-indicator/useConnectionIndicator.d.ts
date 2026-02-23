/**
 * Connection Indicator Headless Hook
 *
 * Provides all logic and state for connection status display.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
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
export declare function useConnectionIndicator(): ConnectionIndicatorState;
//# sourceMappingURL=useConnectionIndicator.d.ts.map