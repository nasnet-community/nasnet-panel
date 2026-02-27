/**
 * ConfirmationDialog Component
 *
 * Reusable confirmation dialog for user actions.
 * Supports both destructive (amber/red) and constructive (green) variants.
 *
 * @module @nasnet/ui/patterns/confirmation-dialog
 */

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  cn,
} from '@nasnet/ui/primitives';

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Visual variant for the confirm button */
  variant?: 'default' | 'destructive' | 'constructive';
  /** Whether the action is loading */
  isLoading?: boolean;
}

/**
 * Confirmation Dialog Component
 *
 * Displays a modal dialog with title, description, and action buttons.
 * Supports destructive (amber/red) and constructive (green) variants.
 * Includes loading state for async actions.
 * Follows accessibility best practices.
 *
 * Features:
 * - Three variants: default, destructive, constructive
 * - Loading state with button text change
 * - Optional cancel callback
 * - Semantic color tokens
 * - WCAG AAA accessible
 * - Keyboard support (Escape to close)
 *
 * @example
 * ```tsx
 * const [showDialog, setShowDialog] = useState(false);
 *
 * <ConfirmationDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Disable wlan1?"
 *   description="This will disable the wireless interface. Connected clients will be disconnected."
 *   confirmLabel="Disable"
 *   variant="destructive"
 *   onConfirm={handleDisable}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
const ConfirmationDialogComponent = React.forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      onConfirm,
      onCancel,
      variant = 'default',
      isLoading = false,
    },
    ref
  ) => {
    const handleConfirm = React.useCallback(() => {
      onConfirm();
    }, [onConfirm]);

    const handleCancel = React.useCallback(() => {
      if (onCancel) {
        onCancel();
      }
      onOpenChange(false);
    }, [onCancel, onOpenChange]);

    // Determine button styling based on variant
    const confirmButtonVariant = React.useMemo(() => {
      if (variant === 'destructive') return 'destructive';
      if (variant === 'constructive') return 'default';
      return 'default';
    }, [variant]);

    // Constructive variant uses semantic success color
    const confirmButtonClassName = React.useMemo(() => {
      if (variant === 'constructive') {
        return 'bg-success hover:bg-success/90 text-white';
      }
      return undefined;
    }, [variant]);

    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent
          ref={ref}
          className={cn(
            'sm:max-w-[425px]',
            'bg-card border-border rounded-[var(--semantic-radius-modal)] border',
            'shadow-[var(--semantic-shadow-modal)]',
            'p-6'
          )}
          role="alertdialog"
          aria-describedby="confirmation-description"
        >
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-warning/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                <svg
                  className="text-warning h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 6H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2h-4z"
                  />
                </svg>
              </div>
              <DialogTitle className="font-display text-lg font-semibold">{title}</DialogTitle>
            </div>
            <DialogDescription
              id="confirmation-description"
              className="text-muted-foreground mt-2 text-sm"
            >
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
              className="sm:flex-initial"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmButtonVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              className={
                confirmButtonClassName ?
                  cn('sm:flex-initial', confirmButtonClassName)
                : 'sm:flex-initial'
              }
              aria-busy={isLoading}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ConfirmationDialogComponent.displayName = 'ConfirmationDialog';

export const ConfirmationDialog = React.memo(ConfirmationDialogComponent);
