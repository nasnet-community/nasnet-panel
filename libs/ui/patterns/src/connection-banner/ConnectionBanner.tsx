import { memo } from 'react';

import { AlertTriangle, Wifi } from 'lucide-react';

import { useConnectionStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/primitives';

export interface ConnectionBannerProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

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
 * @example
 * ```tsx
 * // Basic usage - place below app header
 * <ConnectionBanner />
 *
 * // With custom styling
 * <ConnectionBanner className="mt-2" />
 * ```
 *
 * Positioning:
 * - Place in app layout below header
 * - Will automatically show/hide based on connection state
 */
export const ConnectionBanner = memo(function ConnectionBanner({
  className,
}: ConnectionBannerProps = {}) {
  const state = useConnectionStore((store) => store.state);

  // Don't render when connected
  if (state === 'connected') {
    return null;
  }

  const isReconnecting = state === 'reconnecting';

  return (
    <div
      className={cn(
        'py-component-sm px-component-md w-full text-center',
        isReconnecting ? 'bg-warning text-warning-foreground animate-pulse' : 'bg-error text-white',
        'transition-colors duration-150',
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="gap-component-sm flex items-center justify-center">
        {isReconnecting ?
          <Wifi
            className="h-4 w-4 flex-shrink-0 animate-pulse"
            aria-hidden="true"
          />
        : <AlertTriangle
            className="h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
        }
        <p className="text-sm font-medium">
          {isReconnecting ?
            'Reconnecting to router...'
          : 'Connection lost. Attempting to reconnect...'}
        </p>
      </div>
    </div>
  );
});

ConnectionBanner.displayName = 'ConnectionBanner';
