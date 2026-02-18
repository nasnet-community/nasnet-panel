/**
 * Session Expiring Dialog Component
 *
 * Modal warning users their session will expire soon with option to extend.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { useEffect, useState, useCallback } from 'react';

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
 cn } from '@nasnet/ui/primitives';

// ===== Types =====

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
  const { token: accessToken, tokenExpiry: expiresAt, clearAuth: logout, isAuthenticated } = useAuthStore();
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
 * - Countdown timer
 * - Option to extend session
 * - Option to logout
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
export function SessionExpiringDialog({
  warningThreshold = 300,
  onExtendSession,
  onSessionExpired,
  autoLogout = true,
  className,
}: SessionExpiringDialogProps) {
  const { timeRemaining, isExpiring, isExpired, logout, isAuthenticated } = useSessionExpiring(warningThreshold);
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

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

  // Determine urgency level
  const isUrgent = timeRemaining <= 60; // Last minute
  const isCritical = timeRemaining <= 30; // Last 30 seconds

  return (
    <Dialog open={isExpiring} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          isCritical && 'border-semantic-error',
          className
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                isCritical
                  ? 'bg-semantic-error/10'
                  : isUrgent
                    ? 'bg-semantic-warning/10'
                    : 'bg-semantic-info/10'
              )}
            >
              {isCritical ? (
                <AlertTriangle className="h-6 w-6 text-semantic-error" />
              ) : (
                <Clock
                  className={cn(
                    'h-6 w-6',
                    isUrgent ? 'text-semantic-warning' : 'text-semantic-info'
                  )}
                />
              )}
            </div>
            <DialogTitle>Session Expiring</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your session will expire soon. Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Countdown Timer */}
          <div className="text-center">
            <div
              className={cn(
                'text-4xl font-mono font-bold',
                isCritical
                  ? 'text-semantic-error animate-pulse'
                  : isUrgent
                    ? 'text-semantic-warning'
                    : 'text-gray-900 dark:text-gray-100'
              )}
            >
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              remaining
            </p>
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
            <div className="px-3 py-2 rounded bg-semantic-error/10 text-semantic-error text-sm">
              {extendError}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>

          {onExtendSession && (
            <Button
              variant="default"
              onClick={handleExtend}
              disabled={isExtending}
              className="w-full sm:w-auto"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Stay Signed In
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

