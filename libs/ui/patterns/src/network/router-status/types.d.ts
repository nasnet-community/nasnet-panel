/**
 * Router Status Component Types
 *
 * Type definitions for the Router Status component that displays
 * real-time router connection status with platform-adaptive UI.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */
/**
 * Router connection status values
 */
export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
/**
 * Connection protocol type
 */
export type ConnectionProtocol = 'REST_API' | 'SSH' | 'TELNET';
/**
 * Props for the RouterStatus component
 */
export interface RouterStatusProps {
    /**
     * Router ID to subscribe to for status updates
     */
    routerId: string;
    /**
     * Force compact mode regardless of screen size
     * @default false
     */
    compact?: boolean;
    /**
     * Override automatic presenter detection
     */
    presenter?: 'mobile' | 'desktop';
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Callback fired when status changes
     */
    onStatusChange?: (status: ConnectionStatus) => void;
}
/**
 * Router status data returned by the headless hook
 */
export interface RouterStatusData {
    /**
     * Current connection status
     */
    status: ConnectionStatus;
    /**
     * Protocol in use (null if not connected)
     */
    protocol: ConnectionProtocol | null;
    /**
     * Latency in milliseconds (null if unknown)
     */
    latencyMs: number | null;
    /**
     * Router model name (null if unknown)
     */
    model: string | null;
    /**
     * RouterOS version (null if unknown)
     */
    version: string | null;
    /**
     * Uptime string (null if unknown)
     */
    uptime: string | null;
    /**
     * Timestamp of last successful connection
     */
    lastConnected: Date | null;
    /**
     * Current reconnection attempt number
     */
    reconnectAttempt: number;
    /**
     * Maximum reconnection attempts before manual retry
     */
    maxReconnectAttempts: number;
}
/**
 * Return type for useRouterStatus hook
 */
export interface UseRouterStatusReturn {
    /**
     * Router status data
     */
    data: RouterStatusData;
    /**
     * Whether initial data is loading
     */
    loading: boolean;
    /**
     * Error if subscription or query failed
     */
    error: Error | null;
    /**
     * Whether the router is currently online (CONNECTED status)
     */
    isOnline: boolean;
    /**
     * Human-readable status label
     */
    statusLabel: string;
    /**
     * Relative time since last connection (e.g., "30 seconds ago")
     */
    lastSeenRelative: string | null;
    /**
     * Trigger a manual status refresh
     */
    refresh: () => Promise<void>;
    /**
     * Force a reconnection attempt
     */
    reconnect: () => Promise<void>;
    /**
     * Disconnect from the router
     */
    disconnect: () => Promise<void>;
    /**
     * Cancel an ongoing reconnection attempt
     */
    cancelReconnect: () => void;
}
/**
 * Props passed to platform presenters
 */
export interface RouterStatusPresenterProps {
    /**
     * Router status state from the headless hook
     */
    state: UseRouterStatusReturn;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Size variants for the status indicator
 */
export type StatusIndicatorSize = 'sm' | 'md' | 'lg';
/**
 * Props for the StatusIndicator component
 */
export interface StatusIndicatorProps {
    /**
     * Current connection status
     */
    status: ConnectionStatus;
    /**
     * Size variant
     * - sm: 12px
     * - md: 16px (default)
     * - lg: 24px
     */
    size?: StatusIndicatorSize;
    /**
     * Show pulse animation for CONNECTING status
     * @default true
     */
    animated?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Accessible label for screen readers
     */
    'aria-label'?: string;
}
/**
 * Status labels for display
 */
export declare const STATUS_LABELS: Record<ConnectionStatus, string>;
/**
 * Default max reconnect attempts
 */
export declare const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
//# sourceMappingURL=types.d.ts.map