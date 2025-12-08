import { AlertTriangle, Wifi } from 'lucide-react';
import { useConnectionStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/primitives';

/**
 * ConnectionBanner Component
 *
 * Displays a warning banner when connection is lost or reconnecting.
 * Automatically shows/hides based on connection state from store.
 *
 * Features:
 * - Shown when state is 'disconnected' or 'reconnecting'
 * - Hidden when state is 'connected'
 * - Full-width banner at top of content area
 * - Warning color scheme (yellow/orange)
 * - Appropriate message for each state
 * - ARIA live region for screen readers
 *
 * Usage:
 * ```tsx
 * <ConnectionBanner />
 * ```
 *
 * Positioning:
 * - Place in app layout below header
 * - Will automatically show/hide
 */
export function ConnectionBanner() {
  const state = useConnectionStore((store) => store.state);

  // Don't render when connected
  if (state === 'connected') {
    return null;
  }

  const isReconnecting = state === 'reconnecting';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-6 py-4 border-b transition-colors',
        'bg-warning/10 border-warning/30 backdrop-blur-sm',
        'shadow-sm'
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {isReconnecting ? (
        <Wifi className="h-5 w-5 text-warning animate-pulse" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
      )}
      <p className="text-sm font-semibold text-warning dark:text-amber-400">
        {isReconnecting
          ? 'Reconnecting to router...'
          : 'Connection lost. Attempting to reconnect...'}
      </p>
    </div>
  );
}
