/**
 * Reconnecting Overlay Component
 *
 * Full-screen overlay shown during connection loss and reconnection attempts.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { Loader2, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

import { Button, Card, Progress , cn } from '@nasnet/ui/primitives';

import { useConnectionIndicator } from '../connection-indicator/useConnectionIndicator';

// ===== Types =====

export interface ReconnectingOverlayProps {
  /**
   * Whether to show as a full-screen overlay
   * @default true
   */
  fullScreen?: boolean;

  /**
   * Custom message to display
   */
  message?: string;

  /**
   * Whether to show the retry button even during auto-reconnection
   * @default false
   */
  alwaysShowRetry?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when overlay is dismissed (if dismissible)
   */
  onDismiss?: () => void;
}

// ===== Component =====

/**
 * Reconnecting Overlay
 *
 * Shows during connection loss with:
 * - Progress indicator for reconnection attempts
 * - Manual retry button when max attempts reached
 * - Helpful status messages
 *
 * @example
 * ```tsx
 * // Full screen overlay (default)
 * <ReconnectingOverlay />
 *
 * // Inline card (not full screen)
 * <ReconnectingOverlay fullScreen={false} />
 *
 * // Custom message
 * <ReconnectingOverlay message="Lost connection to router" />
 * ```
 */
export function ReconnectingOverlay({
  fullScreen = true,
  message,
  alwaysShowRetry = false,
  className,
  onDismiss,
}: ReconnectingOverlayProps) {
  const {
    wsStatus,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    showManualRetry,
    onRetry,
  } = useConnectionIndicator();

  // Only show when disconnected or reconnecting
  const shouldShow = wsStatus === 'disconnected' || wsStatus === 'error' || isReconnecting;

  if (!shouldShow) {
    return null;
  }

  // Calculate progress percentage
  const progress = maxReconnectAttempts > 0
    ? (reconnectAttempts / maxReconnectAttempts) * 100
    : 0;

  // Determine status message
  const statusMessage = message ?? (
    isReconnecting
      ? 'Attempting to reconnect...'
      : showManualRetry
        ? 'Connection failed. Please retry manually.'
        : 'Connection lost'
  );

  // Determine icon
  const StatusIcon = isReconnecting
    ? Loader2
    : showManualRetry
      ? AlertTriangle
      : WifiOff;

  const content = (
    <Card
      className={cn(
        'p-6 max-w-sm mx-auto',
        'bg-card',
        'border-2 border-semantic-warning',
        !fullScreen && className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4" aria-live="polite">
        {/* Icon */}
        <div
          className={cn(
            'p-4 rounded-full',
            isReconnecting
              ? 'bg-semantic-warning/10'
              : showManualRetry
                ? 'bg-semantic-error/10'
                : 'bg-muted'
          )}
          {...(isReconnecting ? { role: 'status', 'aria-label': 'Reconnecting to server' } : {})}
        >
          <StatusIcon
            className={cn(
              'h-8 w-8',
              isReconnecting && 'animate-spin text-semantic-warning',
              showManualRetry && 'text-semantic-error',
              !isReconnecting && !showManualRetry && 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-foreground">
            {isReconnecting ? 'Reconnecting' : 'Disconnected'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {statusMessage}
          </p>
        </div>

        {/* Progress */}
        {isReconnecting && (
          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Attempt {reconnectAttempts} of {maxReconnectAttempts}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {(showManualRetry || alwaysShowRetry) && (
            <Button
              variant="default"
              onClick={onRetry}
              className="min-w-[120px]"
              aria-label="Retry connection now"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Now
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>

        {/* Help text */}
        {showManualRetry && (
          <p className="text-xs text-muted-foreground">
            Check your network connection and ensure the router is accessible.
          </p>
        )}
      </div>
    </Card>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reconnecting-title"
      aria-describedby="reconnecting-description"
    >
      <div id="reconnecting-title" className="sr-only">
        Connection Status
      </div>
      <div id="reconnecting-description" className="sr-only">
        {statusMessage}
      </div>
      {content}
    </div>
  );
}

// ===== Hook =====

/**
 * Hook for custom reconnecting overlay implementations
 */
export function useReconnectingState() {
  const state = useConnectionIndicator();

  return {
    shouldShow: state.wsStatus === 'disconnected' || state.wsStatus === 'error' || state.isReconnecting,
    isReconnecting: state.isReconnecting,
    reconnectAttempts: state.reconnectAttempts,
    maxReconnectAttempts: state.maxReconnectAttempts,
    progress: state.maxReconnectAttempts > 0
      ? (state.reconnectAttempts / state.maxReconnectAttempts) * 100
      : 0,
    showManualRetry: state.showManualRetry,
    onRetry: state.onRetry,
  };
}

