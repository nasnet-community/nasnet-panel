/**
 * useSortableList Hook
 *
 * Headless hook for managing sortable list state and operations.
 * Provides drag state, selection, reordering, and undo/redo capabilities.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import { useState, useCallback, useMemo, useRef } from 'react';

import { arrayMove } from '@dnd-kit/sortable';

import type {
  SortableItemData,
  UseSortableListOptions,
  UseSortableListReturn,
  ReorderEvent,
  MultiReorderEvent,
} from '../types';
import type { UniqueIdentifier, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';

// ============================================================================
// History State for Undo/Redo
// ============================================================================

interface HistoryState<T> {
  past: T[][];
  present: T[];
  future: T[][];
}

function createHistoryState<T>(items: T[]): HistoryState<T> {
  return {
    past: [],
    present: items,
    future: [],
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSortableList<T extends SortableItemData>(
  initialItems: T[],
  options: UseSortableListOptions<T> = {}
): UseSortableListReturn<T> {
  const {
    onReorder,
    onMultiReorder,
    validateDrop,
    multiSelect = false,
    undoEnabled = true,
  } = options;

  // ============================================================================
  // State
  // ============================================================================

  // History state for undo/redo
  const [history, setHistory] = useState<HistoryState<T>>(() =>
    createHistoryState(initialItems)
  );

  // Drag state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<UniqueIdentifier>>(new Set());

  // Track last selected for range selection
  const lastSelectedRef = useRef<UniqueIdentifier | null>(null);

  // ============================================================================
  // Derived State
  // ============================================================================

  const items = history.present;

  const isDragging = activeId !== null;

  const activeItem = useMemo(
    () => (activeId ? items.find((item) => item.id === activeId) ?? null : null),
    [activeId, items]
  );

  const overItem = useMemo(
    () => (overId ? items.find((item) => item.id === overId) ?? null : null),
    [overId, items]
  );

  const canUndo = undoEnabled && history.past.length > 0;
  const canRedo = undoEnabled && history.future.length > 0;

  // ============================================================================
  // History Management
  // ============================================================================

  const pushHistory = useCallback(
    (newItems: T[]) => {
      if (!undoEnabled) {
        setHistory((h) => ({ ...h, present: newItems }));
        return;
      }

      setHistory((h) => ({
        past: [...h.past, h.present],
        present: newItems,
        future: [], // Clear future on new action
      }));
    },
    [undoEnabled]
  );

  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory((h) => {
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory((h) => {
      const next = h.future[0];
      const newFuture = h.future.slice(1);

      return {
        past: [...h.past, h.present],
        present: next,
        future: newFuture,
      };
    });
  }, [canRedo]);

  // ============================================================================
  // Selection Management
  // ============================================================================

  const isSelected = useCallback(
    (id: UniqueIdentifier) => selectedIds.has(id),
    [selectedIds]
  );

  const select = useCallback(
    (id: UniqueIdentifier) => {
      if (!multiSelect) {
        setSelectedIds(new Set([id]));
      } else {
        setSelectedIds((prev) => new Set([...prev, id]));
      }
      lastSelectedRef.current = id;
    },
    [multiSelect]
  );

  const deselect = useCallback((id: UniqueIdentifier) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelection = useCallback(
    (id: UniqueIdentifier) => {
      if (selectedIds.has(id)) {
        deselect(id);
      } else {
        select(id);
      }
    },
    [selectedIds, select, deselect]
  );

  const selectRange = useCallback(
    (fromId: UniqueIdentifier, toId: UniqueIdentifier) => {
      if (!multiSelect) return;

      const fromIndex = items.findIndex((item) => item.id === fromId);
      const toIndex = items.findIndex((item) => item.id === toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      const rangeIds = items.slice(start, end + 1).map((item) => item.id);
      setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
      lastSelectedRef.current = toId;
    },
    [items, multiSelect]
  );

  const selectAll = useCallback(() => {
    if (!multiSelect) return;
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items, multiSelect]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, []);

  // ============================================================================
  // Reorder Operations
  // ============================================================================

  const reorder = useCallback(
    (fromIndex: number, toIndex: number): T[] | null => {
      if (fromIndex === toIndex) return null;
      if (fromIndex < 0 || toIndex < 0) return null;
      if (fromIndex >= items.length || toIndex >= items.length) return null;

      const item = items[fromIndex];

      // Validate drop if validation function provided
      if (validateDrop) {
        const result = validateDrop(item, toIndex, items);
        const isValid = typeof result === 'boolean' ? result : result.valid;
        if (!isValid) return null;
      }

      return arrayMove(items, fromIndex, toIndex);
    },
    [items, validateDrop]
  );

  const moveItem = useCallback(
    (id: UniqueIdentifier, toIndex: number) => {
      const fromIndex = items.findIndex((item) => item.id === id);
      if (fromIndex === -1) return;

      const newItems = reorder(fromIndex, toIndex);
      if (!newItems) return;

      pushHistory(newItems);

      onReorder?.({
        item: items[fromIndex],
        fromIndex,
        toIndex,
        items: newItems,
      });
    },
    [items, reorder, pushHistory, onReorder]
  );

  const moveUp = useCallback(
    (id: UniqueIdentifier) => {
      const index = items.findIndex((item) => item.id === id);
      if (index > 0) {
        moveItem(id, index - 1);
      }
    },
    [items, moveItem]
  );

  const moveDown = useCallback(
    (id: UniqueIdentifier) => {
      const index = items.findIndex((item) => item.id === id);
      if (index < items.length - 1) {
        moveItem(id, index + 1);
      }
    },
    [items, moveItem]
  );

  const moveToTop = useCallback(
    (id: UniqueIdentifier) => {
      moveItem(id, 0);
    },
    [moveItem]
  );

  const moveToBottom = useCallback(
    (id: UniqueIdentifier) => {
      moveItem(id, items.length - 1);
    },
    [items.length, moveItem]
  );

  // ============================================================================
  // Multi-Select Reorder
  // ============================================================================

  const multiReorder = useCallback(
    (ids: UniqueIdentifier[], toIndex: number) => {
      if (!multiSelect || ids.length === 0) return;

      // Get indices of selected items
      const fromIndices = ids
        .map((id) => items.findIndex((item) => item.id === id))
        .filter((i) => i !== -1)
        .sort((a, b) => a - b);

      if (fromIndices.length === 0) return;

      // Remove selected items from array
      const selectedItems = fromIndices.map((i) => items[i]);
      const remainingItems = items.filter((item) => !ids.includes(item.id));

      // Calculate adjusted target index
      const insertIndex = Math.min(toIndex, remainingItems.length);

      // Insert selected items at target position
      const newItems = [
        ...remainingItems.slice(0, insertIndex),
        ...selectedItems,
        ...remainingItems.slice(insertIndex),
      ];

      pushHistory(newItems);

      onMultiReorder?.({
        items: selectedItems,
        fromIndices,
        toIndex: insertIndex,
        allItems: newItems,
      });
    },
    [items, multiSelect, pushHistory, onMultiReorder]
  );

  // ============================================================================
  // Drag Event Handlers
  // ============================================================================

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id);

      // If dragging an unselected item in multi-select mode,
      // select only that item
      if (multiSelect && !selectedIds.has(event.active.id)) {
        setSelectedIds(new Set([event.active.id]));
      }
    },
    [multiSelect, selectedIds]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);

      if (!over) return;
      if (active.id === over.id) return;

      const fromIndex = items.findIndex((item) => item.id === active.id);
      const toIndex = items.findIndex((item) => item.id === over.id);

      if (fromIndex === -1 || toIndex === -1) return;

      // Handle multi-select drag
      if (multiSelect && selectedIds.size > 1 && selectedIds.has(active.id)) {
        multiReorder(Array.from(selectedIds), toIndex);
        return;
      }

      // Handle single item drag
      const newItems = reorder(fromIndex, toIndex);
      if (!newItems) return;

      pushHistory(newItems);

      onReorder?.({
        item: items[fromIndex],
        fromIndex,
        toIndex,
        items: newItems,
      });
    },
    [items, multiSelect, selectedIds, reorder, multiReorder, pushHistory, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  // ============================================================================
  // Set Items Directly
  // ============================================================================

  const setItems = useCallback(
    (newItems: T[]) => {
      setHistory((h) => ({
        ...h,
        present: newItems,
      }));
    },
    []
  );

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    items,
    activeId,
    overId,
    isDragging,
    activeItem,
    overItem,
    selectedIds,
    isSelected,
    select,
    deselect,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    moveItem,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    undo,
    redo,
    canUndo,
    canRedo,
    setItems,
    // Internal handlers for DndContext
    _handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  } as UseSortableListReturn<T> & {
    _handlers: {
      onDragStart: (event: DragStartEvent) => void;
      onDragOver: (event: DragOverEvent) => void;
      onDragEnd: (event: DragEndEvent) => void;
      onDragCancel: () => void;
    };
  };
}

export default useSortableList;
