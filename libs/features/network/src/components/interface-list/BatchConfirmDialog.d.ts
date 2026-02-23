import { BatchInterfaceAction } from '@nasnet/api-client/generated';
export interface BatchConfirmDialogProps {
    /** Whether dialog is open */
    open: boolean;
    /** Batch action type (Enable, Disable, Update) */
    action: BatchInterfaceAction | null;
    /** Interfaces affected by batch operation */
    interfaces: any[];
    /** Callback when action is confirmed */
    onConfirm: () => void;
    /** Callback when dialog is cancelled */
    onCancel: () => void;
    /** Optional CSS class */
    className?: string;
}
/**
 * Batch Confirm Dialog Component
 * Provides safety confirmation for batch operations with countdown for dangerous actions.
 * Shows impact analysis and prevents critical operations like disabling gateway interfaces.
 *
 * @example
 * ```tsx
 * <BatchConfirmDialog
 *   open={isOpen}
 *   action={BatchInterfaceAction.Disable}
 *   interfaces={selectedInterfaces}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare function BatchConfirmDialog({ open, action, interfaces, onConfirm, onCancel, className, }: BatchConfirmDialogProps): import("react/jsx-runtime").JSX.Element | null;
export declare namespace BatchConfirmDialog {
    var displayName: string;
}
//# sourceMappingURL=BatchConfirmDialog.d.ts.map