/**
 * UndoFloatingButton Component
 * @description Floating button with countdown for template rollback
 *
 * Features:
 * - 5-minute countdown (300 seconds)
 * - Floating bottom-right position
 * - Confirmation dialog before rollback
 * - Auto-hide after countdown expires
 * - Visual countdown progress
 *
 * @module @nasnet/features/firewall/components
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { Undo2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives/dialog';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Progress } from '@nasnet/ui/primitives/progress';

// ============================================
// CONSTANTS
// ============================================

/** Total countdown duration in seconds (5 minutes) */
const TOTAL_SECONDS = 300;

/** Update interval in milliseconds */
const UPDATE_INTERVAL = 1000;

/** Minimum touch target size in pixels */
const MIN_TOUCH_TARGET = 44;

// ============================================
// COMPONENT PROPS
// ============================================

export interface UndoFloatingButtonProps {
  /** Callback when rollback is confirmed */
  onRollback: () => Promise<void>;

  /** Callback when countdown expires */
  onExpire?: () => void;

  /** Whether rollback is in progress */
  isRollingBack?: boolean;

  /** Template name for confirmation message */
  templateName?: string;

  /** Number of rules applied */
  rulesApplied?: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format seconds as MM:SS display
 * @param seconds - Remaining seconds
 * @returns Formatted time string (e.g., "5:00")
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get urgency level based on remaining time
 * @param seconds - Remaining seconds
 * @returns Urgency level for styling
 */
function getUrgencyLevel(seconds: number): 'normal' | 'warning' | 'critical' {
  if (seconds <= 30) return 'critical';
  if (seconds <= 60) return 'warning';
  return 'normal';
}

// ============================================
// COMPONENT
// ============================================

export const UndoFloatingButton = memo(function UndoFloatingButton({
  onRollback,
  onExpire,
  isRollingBack = false,
  templateName = 'template',
  rulesApplied = 0,
}: UndoFloatingButtonProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsVisible(false);
      onExpire?.();
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalId);
          setIsVisible(false);
          onExpire?.();
        }
        return next;
      });
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [secondsRemaining, onExpire]);

  const handleRollback = useCallback(async () => {
    setShowConfirmDialog(false);
    await onRollback();
  }, [onRollback]);

  const handleOpenConfirmDialog = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const urgencyLevel = getUrgencyLevel(secondsRemaining);
  const progressValue = (secondsRemaining / TOTAL_SECONDS) * 100;

  // Hide button if not visible or rollback complete
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-2">
          {/* Countdown Display */}
          <div
            role="status"
            aria-live="polite"
            aria-label={`Rollback countdown: ${formatTime(secondsRemaining)} remaining`}
            className={`rounded-lg px-4 py-2 shadow-lg transition-colors ${
              urgencyLevel === 'critical'
                ? 'bg-destructive text-destructive-foreground'
                : urgencyLevel === 'warning'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-card border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rollback available</span>
              <span className="font-mono text-lg font-bold">
                {formatTime(secondsRemaining)}
              </span>
            </div>
            <Progress
              value={progressValue}
              className={`mt-1 h-1 ${
                urgencyLevel === 'critical'
                  ? 'bg-destructive-foreground/20'
                  : urgencyLevel === 'warning'
                    ? 'bg-warning-foreground/20'
                    : 'bg-muted'
              }`}
            />
          </div>

          {/* Undo Button */}
          <Button
            size="lg"
            variant={urgencyLevel === 'critical' ? 'destructive' : 'default'}
            className={`min-h-[${MIN_TOUCH_TARGET}px] h-14 shadow-lg`}
            onClick={handleOpenConfirmDialog}
            disabled={isRollingBack}
            aria-label={isRollingBack ? 'Rolling back changes in progress' : 'Undo recent template changes'}
          >
            <Undo2 className="mr-2 h-5 w-5" aria-hidden="true" />
            {isRollingBack ? 'Rolling back...' : 'Undo Changes'}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
              Confirm Rollback
            </DialogTitle>
            <DialogDescription>
              This will undo all changes made by the template application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Info */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 text-sm font-medium">Template Applied</h4>
              <p className="text-sm text-muted-foreground">{templateName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {rulesApplied} firewall rule{rulesApplied !== 1 ? 's' : ''} created
              </p>
            </div>

            {/* Warning Alert */}
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <p className="font-medium">What will happen:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>All {rulesApplied} firewall rules will be removed</li>
                  <li>Router configuration will be restored to previous state</li>
                  <li>Changes cannot be undone after rollback</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Time Remaining */}
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium">Time remaining</span>
              <span className="font-mono text-lg font-bold">
                {formatTime(secondsRemaining)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseConfirmDialog}
              disabled={isRollingBack}
              aria-label="Keep changes and dismiss rollback confirmation"
              className={`min-h-[${MIN_TOUCH_TARGET}px]`}
            >
              Keep Changes
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={isRollingBack}
              aria-label="Confirm rollback of all template changes"
              className={`min-h-[${MIN_TOUCH_TARGET}px]`}
            >
              {isRollingBack ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Rolling Back...
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Confirm Rollback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

UndoFloatingButton.displayName = 'UndoFloatingButton';
