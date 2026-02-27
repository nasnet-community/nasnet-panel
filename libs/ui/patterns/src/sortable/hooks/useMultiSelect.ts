/**
 * useMultiSelect Hook
 *
 * Manages multi-selection state for sortable lists.
 * Supports Shift+click for range selection and Ctrl/Cmd+click for toggle.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import type { SortableItemData } from '../types';
import type { UniqueIdentifier } from '@dnd-kit/core';

// ============================================================================
// Types
// ============================================================================

export interface UseMultiSelectOptions<T extends SortableItemData> {
  /** Items to select from */
  items: T[];
  /** Whether multi-select is enabled */
  enabled?: boolean;
  /** Maximum number of items that can be selected */
  maxSelection?: number;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: UniqueIdentifier[]) => void;
  /** Initial selection */
  initialSelection?: UniqueIdentifier[];
}

export interface UseMultiSelectReturn {
  /** Set of selected item IDs */
  selectedIds: Set<UniqueIdentifier>;
  /** Number of selected items */
  selectionCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Whether all items are selected */
  allSelected: boolean;
  /** Whether some (but not all) items are selected */
  someSelected: boolean;
  /** Check if an item is selected */
  isSelected: (id: UniqueIdentifier) => boolean;
  /** Handle click on an item (with keyboard modifiers) */
  handleClick: (id: UniqueIdentifier, event: React.MouseEvent) => void;
  /** Handle keyboard selection (Shift+Arrow) */
  handleKeyboardSelect: (id: UniqueIdentifier, event: React.KeyboardEvent) => void;
  /** Select a single item (clears other selections) */
  select: (id: UniqueIdentifier) => void;
  /** Add item to selection */
  addToSelection: (id: UniqueIdentifier) => void;
  /** Remove item from selection */
  removeFromSelection: (id: UniqueIdentifier) => void;
  /** Toggle item selection */
  toggleSelection: (id: UniqueIdentifier) => void;
  /** Select range of items */
  selectRange: (fromId: UniqueIdentifier, toId: UniqueIdentifier) => void;
  /** Select all items */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Get selected items data */
  getSelectedItems: <T extends SortableItemData>(items: T[]) => T[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMultiSelect<T extends SortableItemData>(
  options: UseMultiSelectOptions<T>
): UseMultiSelectReturn {
  const { items, enabled = true, maxSelection, onSelectionChange, initialSelection = [] } = options;

  // ============================================================================
  // State
  // ============================================================================

  const [selectedIds, setSelectedIds] = useState<Set<UniqueIdentifier>>(
    () => new Set(initialSelection)
  );

  // Track last selected item for range selection
  const lastSelectedRef = useRef<UniqueIdentifier | null>(
    initialSelection.length > 0 ? initialSelection[initialSelection.length - 1] : null
  );

  // ============================================================================
  // Derived State
  // ============================================================================

  const selectionCount = selectedIds.size;
  const hasSelection = selectionCount > 0;
  const allSelected = selectionCount === items.length && items.length > 0;
  const someSelected = hasSelection && !allSelected;

  // ============================================================================
  // Effects
  // ============================================================================

  // Notify on selection change
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  // ============================================================================
  // Selection Methods
  // ============================================================================

  const isSelected = useCallback((id: UniqueIdentifier) => selectedIds.has(id), [selectedIds]);

  const canAddToSelection = useCallback(
    (count = 1) => {
      if (!maxSelection) return true;
      return selectedIds.size + count <= maxSelection;
    },
    [selectedIds.size, maxSelection]
  );

  const select = useCallback((id: UniqueIdentifier) => {
    setSelectedIds(new Set([id]));
    lastSelectedRef.current = id;
  }, []);

  const addToSelection = useCallback(
    (id: UniqueIdentifier) => {
      if (!canAddToSelection()) return;

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      lastSelectedRef.current = id;
    },
    [canAddToSelection]
  );

  const removeFromSelection = useCallback((id: UniqueIdentifier) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelection = useCallback(
    (id: UniqueIdentifier) => {
      if (selectedIds.has(id)) {
        removeFromSelection(id);
      } else {
        addToSelection(id);
      }
    },
    [selectedIds, addToSelection, removeFromSelection]
  );

  const selectRange = useCallback(
    (fromId: UniqueIdentifier, toId: UniqueIdentifier) => {
      const fromIndex = items.findIndex((item) => item.id === fromId);
      const toIndex = items.findIndex((item) => item.id === toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      const rangeItems = items.slice(start, end + 1);

      if (maxSelection && rangeItems.length > maxSelection) {
        // Only select up to maxSelection items
        const limited = rangeItems.slice(0, maxSelection);
        setSelectedIds(new Set(limited.map((item) => item.id)));
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeItems.forEach((item) => next.add(item.id));
          return next;
        });
      }

      lastSelectedRef.current = toId;
    },
    [items, maxSelection]
  );

  const selectAll = useCallback(() => {
    if (!enabled) return;

    const allIds = items.map((item) => item.id);

    if (maxSelection && allIds.length > maxSelection) {
      setSelectedIds(new Set(allIds.slice(0, maxSelection)));
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [items, enabled, maxSelection]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, []);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleClick = useCallback(
    (id: UniqueIdentifier, event: React.MouseEvent) => {
      if (!enabled) {
        select(id);
        return;
      }

      const isModifierKey = event.metaKey || event.ctrlKey;
      const isShiftKey = event.shiftKey;

      if (isShiftKey && lastSelectedRef.current !== null) {
        // Range selection
        selectRange(lastSelectedRef.current, id);
      } else if (isModifierKey) {
        // Toggle selection
        toggleSelection(id);
      } else {
        // Single selection
        select(id);
      }
    },
    [enabled, select, selectRange, toggleSelection]
  );

  const handleKeyboardSelect = useCallback(
    (id: UniqueIdentifier, event: React.KeyboardEvent) => {
      if (!enabled) return;

      const isShiftKey = event.shiftKey;
      const isModifierKey = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl+A for select all
      if (isModifierKey && event.key === 'a') {
        event.preventDefault();
        selectAll();
        return;
      }

      // Shift+Arrow for extend selection
      if (isShiftKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        if (lastSelectedRef.current !== null) {
          selectRange(lastSelectedRef.current, id);
        } else {
          addToSelection(id);
        }
        return;
      }

      // Space/Enter to toggle selection
      if (event.key === ' ' || event.key === 'Enter') {
        if (isModifierKey) {
          toggleSelection(id);
        } else if (isShiftKey && lastSelectedRef.current !== null) {
          selectRange(lastSelectedRef.current, id);
        }
      }
    },
    [enabled, selectAll, selectRange, addToSelection, toggleSelection]
  );

  // ============================================================================
  // Utility Methods
  // ============================================================================

  const getSelectedItems = useCallback(
    <U extends SortableItemData>(allItems: U[]): U[] => {
      return allItems.filter((item) => selectedIds.has(item.id));
    },
    [selectedIds]
  );

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    selectedIds,
    selectionCount,
    hasSelection,
    allSelected,
    someSelected,
    isSelected,
    handleClick,
    handleKeyboardSelect,
    select,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    getSelectedItems,
  };
}

export default useMultiSelect;
