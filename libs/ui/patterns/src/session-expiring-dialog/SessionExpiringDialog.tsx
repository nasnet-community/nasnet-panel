/**
 * Session Expiring Dialog Component
 *
 * Modal warning users their session will expire soon with option to extend.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * Features:
 * - Countdown timer with visual progress bar
 * - Three urgency levels: normal (blue), urgent (amber), critical (red)
 * - Extend session or logout options
 * - Modal cannot be dismissed by clicking outside or pressing Escape
 * - Screen reader announcement via ARIA live regions
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @example
 * ```tsx
 * <SessionExpiringDialog
 *   warningThreshold={300}
 *   onExtendSession={handleRefreshToken}
 *   onSessionExpired={() => navigate('/login')}
 * />
 * ```
 */

import { useEffect, useState, useCallback, useMemo, memo } from 'react';

import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

import { useAuthStore } from '@nasnet/state/stores';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Progress,
  cn,
} from '@nasnet/ui/primitives';

// ===== Types =====

/**
 * Props for SessionExpiringDialog component
 * Controls countdown behavior and callbacks
 */
export interface SessionExpiringDialogProps {
  /**
   * Time in seconds before expiry to show the warning
   * @default 300 (5 minutes)
   */
  warningThreshold?: number;

  /**
   * Callback when user chooses to extend session
   */
  onExtendSession?: () => Promise<void>;

  /**
   * Callback when session expires or user logs out
   */
  onSessionExpired?: () => void;

  /**
   * Whether to auto-logout when countdown reaches zero
   * @default true
   */
  autoLogout?: boolean;

  /**
   * Additional CSS classes for the dialog
   */
  className?: string;
}

// ===== Hook =====

/**
 * Hook for session expiring state
 */
export function useSessionExpiring(warningThreshold = 300) {
  const {
    token: accessToken,
    tokenExpiry: expiresAt,
    clearAuth: logout,
    isAuthenticated,
  } = useAuthStore();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpiring, setIsExpiring] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!isAuthenticated || !expiresAt) {
      setTimeRemaining(null);
      setIsExpiring(false);
      return;
    }

    function updateTimeRemaining() {
      const now = Date.now();
      const expiryTime = expiresAt!.getTime();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

      setTimeRemaining(remaining);
      setIsExpiring(remaining > 0 && remaining <= warningThreshold);
    }

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [accessToken, expiresAt, warningThreshold, isAuthenticated]);

  return {
    timeRemaining,
    isExpiring,
    isExpired: timeRemaining === 0,
    logout,
    isAuthenticated,
  };
}

// ===== Helper Functions =====

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Component =====

/**
 * Session Expiring Dialog
 *
 * Shows when session is about to expire with:
 * - Countdown timer (MM:SS format)
 * - Visual progress bar indicating urgency
 * - Option to extend session
 * - Option to logout
 *
 * Urgency levels:
 * - Normal (>1 minute): Blue clock icon
 * - Urgent (30-60 seconds): Amber icon
 * - Critical (<30 seconds): Red alert icon with pulse animation
 *
 * The dialog cannot be dismissed and takes focus until resolved.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SessionExpiringDialog
 *   onExtendSession={async () => {
 *     await refreshToken();
 *   }}
 * />
 *
 * // Custom warning threshold (2 minutes)
 * <SessionExpiringDialog
 *   warningThreshold={120}
 *   onExtendSession={handleExtend}
 *   onSessionExpired={() => navigate('/login')}
 * />
 * ```
 */
function SessionExpiringDialogComponent({
  warningThreshold = 300,
  onExtendSession,
  onSessionExpired,
  autoLogout = true,
  className,
}: SessionExpiringDialogProps) {
  const { timeRemaining, isExpiring, isExpired, logout, isAuthenticated } =
    useSessionExpiring(warningThreshold);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  // Memoize urgency levels to prevent unnecessary recalculations
  const urgencyLevels = useMemo(() => {
    const remaining = timeRemaining ?? 0;
    return {
      isUrgent: remaining <= 60,
      isCritical: remaining <= 30,
    };
  }, [timeRemaining]);

  // Handle session expiry
  useEffect(() => {
    if (isExpired && autoLogout && isAuthenticated) {
      logout();
      onSessionExpired?.();
    }
  }, [isExpired, autoLogout, logout, onSessionExpired, isAuthenticated]);

  // Handle extend session
  const handleExtend = useCallback(async () => {
    if (!onExtendSession) return;

    setIsExtending(true);
    setExtendError(null);

    try {
      await onExtendSession();
    } catch (error) {
      setExtendError(error instanceof Error ? error.message : 'Failed to extend session');
    } finally {
      setIsExtending(false);
    }
  }, [onExtendSession]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    onSessionExpired?.();
  }, [logout, onSessionExpired]);

  // Don't show if not expiring or not authenticated
  if (!isExpiring || !isAuthenticated || timeRemaining === null) {
    return null;
  }

  // Calculate progress percentage (inverse - fills up as time runs out)
  const progress = ((warningThreshold - timeRemaining) / warningThreshold) * 100;

  const { isUrgent, isCritical } = urgencyLevels;

  return (
    <Dialog
      open={isExpiring}
      onOpenChange={() => {}}
    >
      <DialogContent
        className={cn('sm:max-w-md', isCritical && 'border-semantic-error', className)}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        role="alertdialog"
        aria-labelledby="session-expiring-title"
        aria-describedby="session-expiring-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-full p-2',
                isCritical ? 'bg-semantic-error/10'
                : isUrgent ? 'bg-semantic-warning/10'
                : 'bg-semantic-info/10'
              )}
              aria-hidden="true"
            >
              {isCritical ?
                <AlertTriangle className="text-semantic-error h-6 w-6" />
              : <Clock
                  className={cn(
                    'h-6 w-6',
                    isUrgent ? 'text-semantic-warning' : 'text-semantic-info'
                  )}
                />
              }
            </div>
            <DialogTitle id="session-expiring-title">Session Expiring</DialogTitle>
          </div>
          <DialogDescription
            id="session-expiring-description"
            className="pt-2"
          >
            Your session will expire soon. Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Countdown Timer */}
          <div className="text-center">
            <div
              className={cn(
                'font-mono text-4xl font-bold',
                isCritical ? 'text-semantic-error animate-pulse'
                : isUrgent ? 'text-semantic-warning'
                : 'text-gray-900 dark:text-gray-100'
              )}
            >
              {formatTime(timeRemaining)}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">remaining</p>
          </div>

          {/* Progress Bar */}
          <Progress
            value={progress}
            className={cn(
              'h-2',
              isCritical && '[&>div]:bg-semantic-error',
              isUrgent && !isCritical && '[&>div]:bg-semantic-warning'
            )}
          />

          {/* Error Message */}
          {extendError && (
            <div className="bg-semantic-error/10 text-semantic-error rounded px-3 py-2 text-sm">
              {extendError}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>

          {onExtendSession && (
            <Button
              variant="default"
              onClick={handleExtend}
              disabled={isExtending}
              className="w-full sm:w-auto"
            >
              {isExtending ?
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Extending...
                </>
              : <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Stay Signed In
                </>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const SessionExpiringDialog = memo(SessionExpiringDialogComponent);
SessionExpiringDialog.displayName = 'SessionExpiringDialog';
