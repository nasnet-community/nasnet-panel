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

import { useRef, useCallback, useEffect } from 'react';

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
export function useFocusRestore(
  options: UseFocusRestoreOptions = {}
): UseFocusRestoreReturn {
  const { autoSave = false, autoRestore = false, fallback, restoreDelay = 0 } = options;

  // Store reference to the trigger element
  const triggerRef = useRef<HTMLElement | null>(null);

  /**
   * Save the currently focused element as the trigger
   */
  const saveTrigger = useCallback(() => {
    // Only save if there's an active element that's focusable
    const activeElement = document.activeElement as HTMLElement | null;

    if (
      activeElement &&
      activeElement !== document.body &&
      activeElement !== document.documentElement
    ) {
      triggerRef.current = activeElement;
    }
  }, []);

  /**
   * Restore focus to the saved trigger element
   */
  const restoreFocus = useCallback(() => {
    const restore = () => {
      const trigger = triggerRef.current;

      // Check if trigger element still exists in the DOM and is focusable
      if (trigger && document.body.contains(trigger)) {
        // Check if element is focusable
        const isFocusable =
          trigger.tabIndex >= 0 ||
          trigger.hasAttribute('tabindex') ||
          ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(trigger.tagName);

        if (isFocusable) {
          trigger.focus();
          triggerRef.current = null;
          return;
        }
      }

      // Try fallback if provided
      if (fallback) {
        let fallbackElement: HTMLElement | null = null;

        if (typeof fallback === 'string') {
          fallbackElement = document.querySelector<HTMLElement>(fallback);
        } else if (fallback.current) {
          fallbackElement = fallback.current;
        }

        if (fallbackElement && document.body.contains(fallbackElement)) {
          fallbackElement.focus();
        }
      }

      // Clear the trigger reference
      triggerRef.current = null;
    };

    if (restoreDelay > 0) {
      setTimeout(restore, restoreDelay);
    } else {
      restore();
    }
  }, [fallback, restoreDelay]);

  /**
   * Check if there's a saved trigger element
   */
  const hasSavedTrigger = useCallback(() => {
    return triggerRef.current !== null;
  }, []);

  /**
   * Clear the saved trigger without restoring focus
   */
  const clearTrigger = useCallback(() => {
    triggerRef.current = null;
  }, []);

  // Auto-save on mount if enabled
  useEffect(() => {
    if (autoSave) {
      saveTrigger();
    }
  }, [autoSave, saveTrigger]);

  // Auto-restore on unmount if enabled
  useEffect(() => {
    return () => {
      if (autoRestore) {
        restoreFocus();
      }
    };
  }, [autoRestore, restoreFocus]);

  return {
    saveTrigger,
    restoreFocus,
    hasSavedTrigger,
    clearTrigger,
  };
}

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
export function useFocusManagement(
  options: UseFocusManagementOptions
): UseFocusManagementReturn {
  const { isOpen, onClose, trapFocus = true, closeOnEscape = true } = options;

  const dialogRef = useRef<HTMLElement>(null);
  const { saveTrigger, restoreFocus } = useFocusRestore();

  // Save trigger and focus first element when opening
  useEffect(() => {
    if (isOpen) {
      saveTrigger();

      // Focus first focusable element in dialog
      requestAnimationFrame(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      });
    }
  }, [isOpen, saveTrigger]);

  // Restore focus when closing
  useEffect(() => {
    if (!isOpen) {
      restoreFocus();
    }
  }, [isOpen, restoreFocus]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !trapFocus || !dialogRef.current) return;

    const dialog = dialogRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, trapFocus]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    dialogRef,
    onOpenChange,
  };
}
