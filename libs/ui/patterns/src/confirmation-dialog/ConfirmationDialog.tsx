/**
 * ConfirmationDialog Component
 * Reusable confirmation dialog for user actions
 * Supports both destructive (amber/red) and constructive (green) variants
 */

import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
 Button , cn } from '@nasnet/ui/primitives';

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
 * - Displays a modal dialog with title, description, and action buttons
 * - Supports destructive (amber/red) and constructive (green) variants
 * - Includes loading state for async actions
 * - Follows accessibility best practices
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
export function ConfirmationDialog({
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
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  // Determine button styling based on variant
  const confirmButtonVariant = React.useMemo(() => {
    if (variant === 'destructive') return 'destructive';
    if (variant === 'constructive') return 'default';
    return 'default';
  }, [variant]);

  // Constructive variant uses green color
  const confirmButtonClassName = React.useMemo(() => {
    if (variant === 'constructive') {
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
    return undefined;
  }, [variant]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-card-sm md:rounded-card-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-button flex-1 sm:flex-initial"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn('rounded-button flex-1 sm:flex-initial', confirmButtonClassName)}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
