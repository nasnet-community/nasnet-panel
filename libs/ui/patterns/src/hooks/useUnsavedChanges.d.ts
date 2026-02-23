/**
 * Unsaved Changes Hook
 *
 * Provides navigation blocking when there are unsaved changes.
 * Integrates with TanStack Router for navigation interception.
 *
 * Features:
 * - Block navigation when changes exist
 * - Show confirmation dialog
 * - Options: Save, Discard, Cancel
 * - Critical change warning
 * - Browser beforeunload handling
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
export interface UseUnsavedChangesOptions {
    /**
     * Whether changes are considered critical (shows warning level dialog)
     * @default false
     */
    isCritical?: boolean;
    /**
     * Custom message for the confirmation dialog
     */
    message?: string;
    /**
     * Callback when user chooses to save
     */
    onSave?: () => Promise<boolean> | boolean;
    /**
     * Callback when user chooses to discard
     */
    onDiscard?: () => void;
    /**
     * Whether to check for unsaved changes
     * @default true
     */
    enabled?: boolean;
    /**
     * Filter function to determine if specific actions count as unsaved
     * By default, only page-scoped actions count
     */
    filter?: (action: {
        scope: 'page' | 'global';
    }) => boolean;
}
export interface UseUnsavedChangesReturn {
    /**
     * Whether there are unsaved changes
     */
    hasUnsavedChanges: boolean;
    /**
     * Number of unsaved changes
     */
    unsavedCount: number;
    /**
     * Whether the confirmation dialog is open
     */
    isDialogOpen: boolean;
    /**
     * Open the confirmation dialog
     */
    openDialog: () => void;
    /**
     * Close the dialog (cancel navigation)
     */
    closeDialog: () => void;
    /**
     * Confirm save action
     */
    confirmSave: () => Promise<void>;
    /**
     * Confirm discard action
     */
    confirmDiscard: () => void;
    /**
     * Mark changes as saved (clears unsaved state)
     */
    markAsSaved: () => void;
    /**
     * Get blocker props for TanStack Router
     */
    getBlockerProps: () => {
        condition: boolean;
        onBlock: () => void;
    };
}
export type DialogAction = 'save' | 'discard' | 'cancel';
/**
 * Hook for handling unsaved changes with navigation blocking
 *
 * @example
 * ```tsx
 * function EditForm() {
 *   const {
 *     hasUnsavedChanges,
 *     isDialogOpen,
 *     closeDialog,
 *     confirmSave,
 *     confirmDiscard,
 *     getBlockerProps,
 *   } = useUnsavedChanges({
 *     onSave: async () => {
 *       await saveForm();
 *       return true;
 *     },
 *     onDiscard: () => {
 *       resetForm();
 *     },
 *   });
 *
 *   // Use with TanStack Router
 *   useBlocker(getBlockerProps());
 *
 *   return (
 *     <>
 *       <Form />
 *       <UnsavedChangesDialog
 *         open={isDialogOpen}
 *         onCancel={closeDialog}
 *         onSave={confirmSave}
 *         onDiscard={confirmDiscard}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export declare function useUnsavedChanges(options?: UseUnsavedChangesOptions): UseUnsavedChangesReturn;
export interface UnsavedChangesDialogProps {
    /**
     * Whether the dialog is open
     */
    open: boolean;
    /**
     * Number of unsaved changes
     */
    count?: number;
    /**
     * Whether changes are critical (shows warning styling)
     */
    isCritical?: boolean;
    /**
     * Custom message
     */
    message?: string;
    /**
     * Cancel callback
     */
    onCancel: () => void;
    /**
     * Save callback
     */
    onSave?: () => void;
    /**
     * Discard callback
     */
    onDiscard: () => void;
    /**
     * Whether save is available
     */
    canSave?: boolean;
}
/**
 * Default message for unsaved changes dialog
 */
export declare function getUnsavedChangesMessage(count: number, isCritical: boolean): string;
//# sourceMappingURL=useUnsavedChanges.d.ts.map