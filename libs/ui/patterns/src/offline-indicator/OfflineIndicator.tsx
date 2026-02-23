/**
 * Offline Indicator Component
 *
 * Banner/toast showing network offline status.
 * Monitors browser online/offline events.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { useState, useEffect, memo } from 'react';

import { WifiOff, Wifi, X } from 'lucide-react';

import { Alert, AlertTitle, AlertDescription, Button , cn } from '@nasnet/ui/primitives';

// ===== Types =====

export interface OfflineIndicatorProps {
  /**
   * Position of the indicator
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Whether the indicator can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Custom offline message
   */
  offlineMessage?: string;

  /**
   * Custom online message (shown briefly after reconnecting)
   */
  onlineMessage?: string;

  /**
   * How long to show the online message (ms)
   * @default 3000
   */
  onlineDuration?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ===== Hook =====

/**
 * Hook for monitoring network online/offline status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setWasOffline(true);
    }

    function handleOffline() {
      setIsOnline(false);
      setWasOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, setWasOffline };
}

// ===== Component =====

/**
 * Offline Indicator
 *
 * Shows a banner when the browser loses network connectivity.
 * Optionally shows a brief "back online" message when reconnected.
 *
 * @example
 * ```tsx
 * // Basic usage - shows at top of viewport
 * <OfflineIndicator />
 *
 * // Bottom position, dismissible
 * <OfflineIndicator position="bottom" dismissible />
 *
 * // Custom messages
 * <OfflineIndicator
 *   offlineMessage="No internet connection"
 *   onlineMessage="Connection restored!"
 * />
 * ```
 */
export const OfflineIndicator = memo(
  function OfflineIndicator({
    position = 'top',
    dismissible = false,
    offlineMessage = "You're offline. Some features may be unavailable.",
    onlineMessage = "You're back online!",
    onlineDuration = 3000,
    className,
  }: OfflineIndicatorProps) {
  const { isOnline, wasOffline, setWasOffline } = useNetworkStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show online message briefly after coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowOnlineMessage(true);
      setDismissed(false);

      const timeout = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, onlineDuration);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isOnline, wasOffline, onlineDuration, setWasOffline]);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  // Don't show if online and no online message to show
  if (isOnline && !showOnlineMessage) {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 px-4',
        position === 'top' ? 'top-0 pt-2' : 'bottom-0 pb-2',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant={isOffline ? 'destructive' : 'default'}
        className={cn(
          'max-w-xl mx-auto shadow-lg',
          'flex items-center justify-between',
          isOffline
            ? 'bg-semantic-error text-white border-semantic-error'
            : 'bg-semantic-success text-white border-semantic-success'
        )}
      >
        <div className="flex items-center gap-3">
          {isOffline ? (
            <WifiOff className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Wifi className="h-5 w-5 flex-shrink-0" />
          )}

          <div>
            <AlertTitle className="text-sm font-semibold">
              {isOffline ? 'Offline' : 'Back Online'}
            </AlertTitle>
            <AlertDescription className="text-sm opacity-90">
              {isOffline ? offlineMessage : onlineMessage}
            </AlertDescription>
          </div>
        </div>

        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-white hover:bg-white/20 -mr-2"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

// ===== Compact Variant =====

export interface OfflineIndicatorCompactProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Compact offline indicator (icon only)
 *
 * Shows a small icon when offline, suitable for headers/nav bars.
 */
export const OfflineIndicatorCompact = memo(
  function OfflineIndicatorCompact({ className }: OfflineIndicatorCompactProps) {
    const { isOnline } = useNetworkStatus();

    if (isOnline) {
      return null;
    }

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded',
          'bg-semantic-error/10 text-semantic-error',
          'text-xs font-medium',
          className
        )}
        role="status"
        aria-label="You are currently offline"
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }
);

OfflineIndicatorCompact.displayName = 'OfflineIndicatorCompact';

