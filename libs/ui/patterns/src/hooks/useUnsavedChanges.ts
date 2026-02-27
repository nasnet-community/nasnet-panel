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

import { useState, useEffect, useCallback, useRef } from 'react';

import { useHistoryStore, selectPastActions, selectCanUndo } from '@nasnet/state/stores';

// =============================================================================
// Types
// =============================================================================

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
  filter?: (action: { scope: 'page' | 'global' }) => boolean;
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

// =============================================================================
// Hook Implementation
// =============================================================================

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
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn {
  const {
    isCritical = false,
    message,
    onSave,
    onDiscard,
    enabled = true,
    filter = (action) => action.scope === 'page',
  } = options;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Get page-scoped history actions
  const past = useHistoryStore(selectPastActions);
  const canUndo = useHistoryStore(selectCanUndo);
  const clearPageHistory = useHistoryStore((s) => s.clearPageHistory);

  // Filter to only unsaved (page-scoped by default) actions
  const unsavedActions = past.filter(filter);
  const hasUnsavedChanges = enabled && unsavedActions.length > 0;
  const unsavedCount = unsavedActions.length;

  // Handle browser beforeunload
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but this triggers the dialog
      e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Open dialog (called when navigation is blocked)
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  // Close dialog (cancel navigation)
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    pendingNavigationRef.current = null;
  }, []);

  // Confirm save action
  const confirmSave = useCallback(async () => {
    if (onSave) {
      const success = await onSave();
      if (!success) {
        // Save failed, keep dialog open
        return;
      }
    }

    // Clear page history after save
    clearPageHistory();
    setIsDialogOpen(false);

    // Continue with pending navigation
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, [onSave, clearPageHistory]);

  // Confirm discard action
  const confirmDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard();
    }

    // Clear page history
    clearPageHistory();
    setIsDialogOpen(false);

    // Continue with pending navigation
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, [onDiscard, clearPageHistory]);

  // Mark as saved (clears unsaved state)
  const markAsSaved = useCallback(() => {
    clearPageHistory();
  }, [clearPageHistory]);

  // Get props for TanStack Router blocker
  const getBlockerProps = useCallback(
    () => ({
      condition: hasUnsavedChanges,
      onBlock: () => {
        openDialog();
      },
    }),
    [hasUnsavedChanges, openDialog]
  );

  return {
    hasUnsavedChanges,
    unsavedCount,
    isDialogOpen,
    openDialog,
    closeDialog,
    confirmSave,
    confirmDiscard,
    markAsSaved,
    getBlockerProps,
  };
}

// =============================================================================
// Confirmation Dialog Component (to be used with the hook)
// =============================================================================

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
export function getUnsavedChangesMessage(count: number, isCritical: boolean): string {
  if (isCritical) {
    return `You have ${count} critical unsaved change${count !== 1 ? 's' : ''}. These changes may affect system stability.`;
  }
  return `You have ${count} unsaved change${count !== 1 ? 's' : ''}. Are you sure you want to leave?`;
}
