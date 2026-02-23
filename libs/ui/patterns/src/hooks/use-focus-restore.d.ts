/**
 * useFocusRestore Hook
 * Manages focus restoration for modals, dialogs, and overlays
 *
 * Features:
 * - Saves the currently focused element when a modal opens
 * - Restores focus to the trigger element when modal closes
 * - Handles edge cases (element removed, element not focusable)
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 * @see WCAG 2.4.3: Focus Order
 */
/**
 * Return type for useFocusRestore hook
 */
export interface UseFocusRestoreReturn {
    /**
     * Save the current active element as the trigger
     * Call this when opening a modal/dialog
     */
    saveTrigger: () => void;
    /**
     * Restore focus to the saved trigger element
     * Call this when closing a modal/dialog
     */
    restoreFocus: () => void;
    /**
     * Check if there's a saved trigger element
     */
    hasSavedTrigger: () => boolean;
    /**
     * Clear the saved trigger without restoring focus
     * Useful when navigating away
     */
    clearTrigger: () => void;
}
/**
 * Options for useFocusRestore hook
 */
export interface UseFocusRestoreOptions {
    /**
     * Whether to automatically save the trigger on mount
     * @default false
     */
    autoSave?: boolean;
    /**
     * Whether to automatically restore on unmount
     * @default false
     */
    autoRestore?: boolean;
    /**
     * Fallback element to focus if saved element is unavailable
     * Can be an element ref or a selector string
     */
    fallback?: React.RefObject<HTMLElement> | string;
    /**
     * Delay in ms before restoring focus
     * Useful for animations
     * @default 0
     */
    restoreDelay?: number;
}
/**
 * useFocusRestore Hook
 *
 * Manages focus restoration for accessible modal/dialog patterns.
 * Ensures focus returns to the element that triggered the modal.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const { saveTrigger, restoreFocus } = useFocusRestore();
 *
 *   useEffect(() => {
 *     if (isOpen) {
 *       saveTrigger();
 *     }
 *   }, [isOpen, saveTrigger]);
 *
 *   const handleClose = () => {
 *     onClose();
 *     restoreFocus();
 *   };
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div role="dialog" aria-modal="true">
 *       {children}
 *       <button onClick={handleClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With auto-save and auto-restore
 * function AutoModal({ isOpen, children }) {
 *   useFocusRestore({
 *     autoSave: true,
 *     autoRestore: true,
 *   });
 *
 *   // Focus is automatically managed
 *   return isOpen ? <div role="dialog">{children}</div> : null;
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns Focus management functions
 */
export declare function useFocusRestore(options?: UseFocusRestoreOptions): UseFocusRestoreReturn;
/**
 * Hook for managing focus within a modal/dialog
 * Combines focus restoration with focus trapping
 *
 * @example
 * ```tsx
 * function Dialog({ isOpen, onClose, children }) {
 *   const { dialogRef, onOpenChange } = useFocusManagement({
 *     isOpen,
 *     onClose,
 *   });
 *
 *   return (
 *     <dialog ref={dialogRef} open={isOpen}>
 *       {children}
 *       <button onClick={() => onOpenChange(false)}>Close</button>
 *     </dialog>
 *   );
 * }
 * ```
 */
export interface UseFocusManagementOptions {
    /**
     * Whether the modal is currently open
     */
    isOpen: boolean;
    /**
     * Callback when the modal should close
     */
    onClose?: () => void;
    /**
     * Whether to trap focus within the modal
     * @default true
     */
    trapFocus?: boolean;
    /**
     * Whether to close on Escape key
     * @default true
     */
    closeOnEscape?: boolean;
}
export interface UseFocusManagementReturn {
    /**
     * Ref to attach to the dialog/modal container
     */
    dialogRef: React.RefObject<HTMLElement>;
    /**
     * Handle open state changes
     */
    onOpenChange: (open: boolean) => void;
}
/**
 * Focus management hook for dialogs
 * Combines focus restoration, focus trapping, and escape handling
 */
export declare function useFocusManagement(options: UseFocusManagementOptions): UseFocusManagementReturn;
//# sourceMappingURL=use-focus-restore.d.ts.map