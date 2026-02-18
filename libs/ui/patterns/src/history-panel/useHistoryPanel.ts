/**
 * Headless History Panel Hook
 *
 * Provides all logic for the history panel without UI implementation.
 * Follows the Headless + Platform Presenters pattern (ADR-018).
 *
 * Features:
 * - Action list management
 * - Jump to history point
 * - Keyboard navigation
 * - Screen reader announcements
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import type { UndoableAction } from '@nasnet/state/stores';
import {
  useHistoryStore,
  selectPastActions,
  selectFutureActions,
  selectCanUndo,
  selectCanRedo,
 formatShortcutKeys } from '@nasnet/state/stores';

// =============================================================================
// Types
// =============================================================================

export interface HistoryPanelItem {
  /** Action data */
  action: UndoableAction;
  /** Index in combined history (past + future) */
  index: number;
  /** Whether this action is in the past (already executed) */
  isInPast: boolean;
  /** Whether this is the current position */
  isCurrent: boolean;
  /** Whether this is the first action */
  isFirst: boolean;
  /** Whether this is the last action */
  isLast: boolean;
}

export interface UseHistoryPanelOptions {
  /** Callback when panel should close */
  onClose?: () => void;
  /** Callback when announcement should be made */
  onAnnounce?: (message: string) => void;
}

export interface UseHistoryPanelReturn {
  /** All history items for display */
  items: HistoryPanelItem[];
  /** Current position in history (index of last executed action) */
  currentIndex: number;
  /** Currently focused item index for keyboard navigation */
  focusedIndex: number;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Whether history is empty */
  isEmpty: boolean;
  /** Total number of items in history */
  totalItems: number;
  /** Jump to a specific index in history */
  jumpTo: (index: number) => Promise<void>;
  /** Undo the last action */
  undo: () => Promise<boolean>;
  /** Redo the next action */
  redo: () => Promise<boolean>;
  /** Clear all history */
  clearAll: () => void;
  /** Move focus up */
  focusPrevious: () => void;
  /** Move focus down */
  focusNext: () => void;
  /** Execute focused action */
  executeFocused: () => Promise<void>;
  /** Get props for item element */
  getItemProps: (index: number) => {
    role: string;
    tabIndex: number;
    'aria-selected': boolean;
    'aria-current': boolean | 'step';
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick: () => Promise<void>;
    onFocus: () => void;
  };
  /** Get props for list container */
  getListProps: () => {
    role: string;
    'aria-label': string;
    'aria-activedescendant': string | undefined;
  };
  /** Get formatted shortcut display */
  getShortcutDisplay: (action: 'undo' | 'redo') => string;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook providing all logic for the history panel
 *
 * @example
 * ```tsx
 * function HistoryPanel() {
 *   const {
 *     items,
 *     currentIndex,
 *     getListProps,
 *     getItemProps,
 *   } = useHistoryPanel();
 *
 *   return (
 *     <ul {...getListProps()}>
 *       {items.map((item, i) => (
 *         <li key={item.action.id} {...getItemProps(i)}>
 *           {item.action.description}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useHistoryPanel(
  options: UseHistoryPanelOptions = {}
): UseHistoryPanelReturn {
  const { onClose, onAnnounce } = options;

  // Store selectors
  const past = useHistoryStore(selectPastActions);
  const future = useHistoryStore(selectFutureActions);
  const canUndo = useHistoryStore(selectCanUndo);
  const canRedo = useHistoryStore(selectCanRedo);
  const storeUndo = useHistoryStore((s) => s.undo);
  const storeRedo = useHistoryStore((s) => s.redo);
  const jumpToIndex = useHistoryStore((s) => s.jumpToIndex);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  // Focus state
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Detect platform for shortcut display
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      navigator.platform.toLowerCase().includes('mac'),
    []
  );

  // Combine past and future into items array
  const items: HistoryPanelItem[] = useMemo(() => {
    const currentIndex = past.length - 1;
    const allActions: HistoryPanelItem[] = [];

    // Past actions
    past.forEach((action, i) => {
      allActions.push({
        action,
        index: i,
        isInPast: true,
        isCurrent: i === currentIndex,
        isFirst: i === 0,
        isLast: false,
      });
    });

    // Future actions (reversed order)
    future.forEach((action, i) => {
      const index = past.length + i;
      allActions.push({
        action,
        index,
        isInPast: false,
        isCurrent: false,
        isFirst: false,
        isLast: i === future.length - 1,
      });
    });

    // Mark last item
    if (allActions.length > 0) {
      allActions[allActions.length - 1].isLast = true;
    }

    return allActions;
  }, [past, future]);

  const currentIndex = past.length - 1;
  const isEmpty = items.length === 0;
  const totalItems = items.length;

  // Jump to a specific index
  const jumpTo = useCallback(
    async (index: number) => {
      if (index < 0 || index >= items.length) return;

      const targetPastLength = index + 1;
      const currentPastLength = past.length;

      if (targetPastLength === currentPastLength) return;

      // Calculate how many undos or redos needed
      if (targetPastLength < currentPastLength) {
        // Need to undo
        const undoCount = currentPastLength - targetPastLength;
        for (let i = 0; i < undoCount; i++) {
          await storeUndo();
        }
        onAnnounce?.(`Jumped to action ${index + 1} of ${items.length}`);
      } else {
        // Need to redo
        const redoCount = targetPastLength - currentPastLength;
        for (let i = 0; i < redoCount; i++) {
          await storeRedo();
        }
        onAnnounce?.(`Jumped to action ${index + 1} of ${items.length}`);
      }
    },
    [items.length, past.length, storeUndo, storeRedo, onAnnounce]
  );

  // Undo with announcement
  const undo = useCallback(async () => {
    const success = await storeUndo();
    if (success) {
      onAnnounce?.('Action undone');
    }
    return success;
  }, [storeUndo, onAnnounce]);

  // Redo with announcement
  const redo = useCallback(async () => {
    const success = await storeRedo();
    if (success) {
      onAnnounce?.('Action redone');
    }
    return success;
  }, [storeRedo, onAnnounce]);

  // Clear all history
  const clearAll = useCallback(() => {
    clearHistory();
    setFocusedIndex(-1);
    onAnnounce?.('History cleared');
  }, [clearHistory, onAnnounce]);

  // Focus navigation
  const focusPrevious = useCallback(() => {
    setFocusedIndex((prev) => {
      const newIndex = prev <= 0 ? items.length - 1 : prev - 1;
      return newIndex;
    });
  }, [items.length]);

  const focusNext = useCallback(() => {
    setFocusedIndex((prev) => {
      const newIndex = prev >= items.length - 1 ? 0 : prev + 1;
      return newIndex;
    });
  }, [items.length]);

  // Execute the focused action (jump to it)
  const executeFocused = useCallback(async () => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      await jumpTo(focusedIndex);
    }
  }, [focusedIndex, items.length, jumpTo]);

  // Focus the element when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0) {
      const element = itemRefs.current.get(focusedIndex);
      element?.focus();
    }
  }, [focusedIndex]);

  // Get props for item element
  const getItemProps = useCallback(
    (index: number) => ({
      role: 'option' as const,
      tabIndex: focusedIndex === index ? 0 : -1,
      'aria-selected': focusedIndex === index,
      'aria-current': items[index]?.isCurrent ? ('step' as const) : false,
      onKeyDown: (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            focusPrevious();
            break;
          case 'ArrowDown':
            e.preventDefault();
            focusNext();
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            jumpTo(index);
            break;
          case 'Escape':
            e.preventDefault();
            onClose?.();
            break;
          case 'Home':
            e.preventDefault();
            setFocusedIndex(0);
            break;
          case 'End':
            e.preventDefault();
            setFocusedIndex(items.length - 1);
            break;
        }
      },
      onClick: () => jumpTo(index),
      onFocus: () => setFocusedIndex(index),
      ref: (el: HTMLElement | null) => {
        if (el) {
          itemRefs.current.set(index, el);
        } else {
          itemRefs.current.delete(index);
        }
      },
    }),
    [focusedIndex, items, focusPrevious, focusNext, jumpTo, onClose]
  );

  // Get props for list container
  const getListProps = useCallback(
    () => ({
      role: 'listbox' as const,
      'aria-label': 'Undo history',
      'aria-activedescendant':
        focusedIndex >= 0 ? `history-item-${focusedIndex}` : undefined,
    }),
    [focusedIndex]
  );

  // Get formatted shortcut display
  const getShortcutDisplay = useCallback(
    (action: 'undo' | 'redo') => {
      if (action === 'undo') {
        return formatShortcutKeys('cmd+z', isMac);
      }
      return formatShortcutKeys('cmd+shift+z', isMac);
    },
    [isMac]
  );

  return {
    items,
    currentIndex,
    focusedIndex,
    canUndo,
    canRedo,
    isEmpty,
    totalItems,
    jumpTo,
    undo,
    redo,
    clearAll,
    focusPrevious,
    focusNext,
    executeFocused,
    getItemProps,
    getListProps,
    getShortcutDisplay,
  };
}

/**
 * Format timestamp for display
 */
export function formatHistoryTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get icon name for action type
 */
export function getActionTypeIcon(type: string): string {
  switch (type) {
    case 'edit':
      return 'pencil';
    case 'delete':
      return 'trash';
    case 'create':
      return 'plus';
    case 'reorder':
      return 'arrows-vertical';
    case 'changeset':
      return 'layers';
    default:
      return 'circle';
  }
}
