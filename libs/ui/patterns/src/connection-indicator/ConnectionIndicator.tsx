import { Circle, Loader2 } from 'lucide-react';
import { useConnectionStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/primitives';

/**
 * ConnectionIndicator Component
 *
 * Small status indicator showing router connection state.
 * Displays as a colored dot with tooltip information.
 *
 * States:
 * - Connected: Green dot
 * - Disconnected: Red dot
 * - Reconnecting: Yellow dot with spinner
 *
 * Features:
 * - Subtle but visible indicator
 * - Color-coded status
 * - Spinner animation when reconnecting
 * - ARIA status role for accessibility
 * - Tooltip showing state and last connected time
 *
 * Usage:
 * ```tsx
 * <ConnectionIndicator />
 * ```
 *
 * Positioning:
 * - Typically placed in app header/nav
 * - Top-right corner recommended
 */
export function ConnectionIndicator() {
  const { state, lastConnectedAt } = useConnectionStore();

  // Determine colors and icon based on state
  const isConnected = state === 'connected';
  const isReconnecting = state === 'reconnecting';
  const isDisconnected = state === 'disconnected';

  const statusColor = isConnected
    ? 'text-success'
    : isDisconnected
      ? 'text-error'
      : 'text-warning';

  const dotColor = isConnected
    ? 'bg-success'
    : isDisconnected
      ? 'bg-error'
      : 'bg-warning';

  const statusText = isConnected
    ? 'Connected'
    : isDisconnected
      ? 'Disconnected'
      : 'Reconnecting';

  // Format last connected time if available
  const lastConnectedText =
    lastConnectedAt && isConnected
      ? `Last connected: ${lastConnectedAt.toLocaleTimeString()}`
      : null;

  return (
    <div
      className="flex items-center gap-2 transition-colors"
      role="status"
      aria-label={statusText}
      title={lastConnectedText || statusText}
    >
      {isReconnecting ? (
        <Loader2 className={cn('h-3.5 w-3.5 animate-spin transition-transform', statusColor)} />
      ) : (
        <Circle
          className={cn('h-3 w-3 transition-colors', dotColor, isConnected && 'animate-pulse-glow')}
          fill="currentColor"
          aria-hidden="true"
        />
      )}
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 sr-only md:not-sr-only">
        {statusText}
      </span>
    </div>
  );
}
