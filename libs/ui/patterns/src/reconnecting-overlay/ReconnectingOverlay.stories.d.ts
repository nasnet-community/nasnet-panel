/**
 * ReconnectingOverlay Stories
 *
 * Demonstrates the overlay that appears when the WebSocket connection
 * is lost or actively being re-established. Because the real component
 * reads from the Zustand connection store, we use a self-contained mock
 * presenter so every connection state can be shown in isolation.
 */
import type { Meta, StoryObj } from '@storybook/react';
interface MockOverlayProps {
    /** Simulated WS status */
    wsStatus?: 'disconnected' | 'error' | 'reconnecting';
    /** Whether auto-reconnection is in progress */
    isReconnecting?: boolean;
    /** Current reconnection attempt number */
    reconnectAttempts?: number;
    /** Maximum number of reconnection attempts */
    maxReconnectAttempts?: number;
    /** Whether the manual-retry button is shown */
    showManualRetry?: boolean;
    /** Whether to render as a full-screen backdrop overlay */
    fullScreen?: boolean;
    /** Custom status message */
    message?: string;
    /** Whether to always show the retry button even during auto-reconnection */
    alwaysShowRetry?: boolean;
    /** Dismiss button callback (renders a Dismiss button when provided) */
    onDismiss?: () => void;
}
declare function MockReconnectingOverlay({ wsStatus, isReconnecting, reconnectAttempts, maxReconnectAttempts, showManualRetry, fullScreen, message, alwaysShowRetry, onDismiss, }: MockOverlayProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockReconnectingOverlay>;
export default meta;
type Story = StoryObj<typeof MockReconnectingOverlay>;
/**
 * Initial disconnection state – connection was lost and no reconnection has started yet.
 */
export declare const Disconnected: Story;
/**
 * Active reconnection in progress – spinning loader and progress bar show attempt count.
 */
export declare const Reconnecting: Story;
/**
 * Reconnection near maximum attempts – progress bar is mostly filled.
 */
export declare const ReconnectingNearMax: Story;
/**
 * Manual retry required – all auto-reconnect attempts have been exhausted.
 * Shows the Retry Now button and help text.
 */
export declare const ManualRetryRequired: Story;
/**
 * Connection error state with a custom message.
 */
export declare const ConnectionError: Story;
/**
 * With dismiss button – useful in non-critical contexts where the user can
 * choose to continue using cached data.
 */
export declare const WithDismiss: Story;
/**
 * Full-screen backdrop variant used in production to block interaction
 * until the connection is restored.
 */
export declare const FullScreen: Story;
//# sourceMappingURL=ReconnectingOverlay.stories.d.ts.map