/**
 * RouteDeleteConfirmation Component
 * NAS-6.5: Static Route Management
 *
 * Safety confirmation dialog for route deletion with:
 * - Impact analysis (default route warning)
 * - Type-to-confirm (case-sensitive)
 * - Countdown timer (10s for critical, 5s for standard)
 * - Consequence display
 */

import { useState, useEffect, useCallback, memo } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Label,
} from '@nasnet/ui/primitives';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { Route } from '@nasnet/api-client/generated';

export interface RouteDeleteConfirmationProps {
  /** The route to delete */
  route: Route;
  /** Dialog open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when user confirms deletion */
  onConfirm: () => Promise<void> | void;
  /** Loading state during deletion */
  loading?: boolean;
}

/**
 * Analyze the impact of deleting a route
 */
function analyzeRouteImpact(route: Route) {
  const isDefaultRoute = route.destination === '0.0.0.0/0';

  if (isDefaultRoute) {
    return {
      isDefaultRoute: true,
      severity: 'CRITICAL' as const,
      message: 'Deleting this route will disconnect the router from the internet.',
      consequences: [
        'All internet-bound traffic will be affected',
        'Remote management connections will be lost',
        'You may lose access to the router',
      ],
      confirmText: 'DELETE DEFAULT ROUTE',
      countdownSeconds: 10,
    };
  }

  return {
    isDefaultRoute: false,
    severity: 'STANDARD' as const,
    message: `Deleting route to ${route.destination}.`,
    consequences: [
      `Traffic to ${route.destination} will be affected`,
      'Connections to this network will fail',
    ],
    confirmText: route.destination,
    countdownSeconds: 5,
  };
}

/**
 * RouteDeleteConfirmation - Safety-first confirmation for route deletion
 *
 * Features:
 * - Impact analysis with severity assessment
 * - Type-to-confirm (user must type exact text)
 * - Countdown timer (prevents accidental clicks)
 * - Case-sensitive matching for critical operations
 * - Detailed consequence display
 *
 * @description Critical operation dialog with countdown and type-to-confirm pattern
 */
function RouteDeleteConfirmationComponent({
  route,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: RouteDeleteConfirmationProps) {
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const impact = analyzeRouteImpact(route);

  // Start countdown when dialog opens
  useEffect(() => {
    if (open) {
      setCountdown(impact.countdownSeconds);
      setConfirmText('');
      setIsSubmitting(false);
    }
  }, [open, impact.countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // Check if user has typed the correct text
  const isConfirmTextValid = confirmText === impact.confirmText;

  // Check if confirm button should be enabled
  const canConfirm = isConfirmTextValid && countdown === 0 && !isSubmitting && !loading;

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent
      console.error('Failed to delete route:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canConfirm, onConfirm, onOpenChange]);

  // Handle cancel
  const handleCancel = () => {
    setConfirmText('');
    setCountdown(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-component-md">
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                impact.severity === 'CRITICAL'
                  ? 'bg-error/10 text-error'
                  : 'bg-warning/10 text-warning'
              )}
            >
              <Icon icon={AlertTriangle} className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-left font-display">
                {impact.isDefaultRoute ? 'Delete Default Route' : 'Delete Route'}
              </DialogTitle>
              {impact.severity === 'CRITICAL' && (
                <div className="mt-1 text-xs font-semibold text-error uppercase tracking-wide">
                  Critical Operation
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-component-md">
          <DialogDescription className="text-left">
            {impact.message}
          </DialogDescription>

          {/* Consequences */}
          <div
            className={cn(
              'rounded-card-sm border-2 p-component-md',
              impact.severity === 'CRITICAL'
                ? 'bg-error/5 border-error/20'
                : 'bg-warning/5 border-warning/20'
            )}
          >
            <h4 className="text-sm font-semibold mb-component-sm">Consequences:</h4>
            <ul className="space-y-component-sm">
              {impact.consequences.map((consequence, index) => (
                <li key={index} className="text-sm text-muted-foreground flex gap-component-sm">
                  <span className="text-destructive">•</span>
                  <span>{consequence}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Type-to-confirm */}
          <div className="space-y-component-sm">
            <Label htmlFor="confirm-text">
              Type <code className="font-mono font-semibold">{impact.confirmText}</code> to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={impact.confirmText}
              disabled={isSubmitting || loading}
              className="font-mono"
              autoComplete="off"
              aria-label="Confirmation text input"
            />
            {confirmText && !isConfirmTextValid && (
              <p className="text-sm text-error">
                Text must match exactly (case-sensitive)
              </p>
            )}
          </div>

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <div className="text-center" aria-live="polite" aria-atomic="true">
              <div className="inline-flex items-center gap-component-sm px-component-sm py-component-sm rounded-lg bg-muted">
                <Icon
                  icon={Loader2}
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">
                  Please wait {countdown} second{countdown !== 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-component-sm">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || loading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="min-h-[44px]"
            aria-label={
              canConfirm
                ? 'Confirm route deletion'
                : `Confirm deletion (waiting ${countdown || 0}s)`
            }
          >
            {(isSubmitting || loading) && (
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

RouteDeleteConfirmationComponent.displayName = 'RouteDeleteConfirmationComponent';

export const RouteDeleteConfirmation = memo(RouteDeleteConfirmationComponent);
