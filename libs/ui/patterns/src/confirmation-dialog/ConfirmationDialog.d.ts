/**
 * ConfirmationDialog Component
 *
 * Reusable confirmation dialog for user actions.
 * Supports both destructive (amber/red) and constructive (green) variants.
 *
 * @module @nasnet/ui/patterns/confirmation-dialog
 */
import * as React from 'react';
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
export declare const ConfirmationDialog: React.MemoExoticComponent<React.ForwardRefExoticComponent<ConfirmationDialogProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=ConfirmationDialog.d.ts.map