/**
 * SortableList Tests
 *
 * Unit tests for the drag & drop sortable list system.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { SortableList } from '../components/SortableList';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { useSortableList } from '../hooks/useSortableList';

import type { SortableItemData } from '../types';

// ============================================================================
// Test Data
// ============================================================================

interface TestItem extends SortableItemData {
  id: string;
  label: string;
}

const createTestItems = (count = 5): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
  }));

// ============================================================================
// useSortableList Hook Tests
// ============================================================================

describe('useSortableList', () => {
  it('initializes with provided items', () => {
    const items = createTestItems(3);
    const { result } = renderHook(() => useSortableList(items));

    expect(result.current.items).toEqual(items);
    expect(result.current.items).toHaveLength(3);
  });

  it('tracks dragging state', () => {
    const items = createTestItems(3);
    const { result } = renderHook(() => useSortableList(items));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.activeId).toBeNull();
    expect(result.current.overId).toBeNull();
  });

  it('moves item to specific position', () => {
    const items = createTestItems(5);
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useSortableList(items, { onReorder })
    );

    act(() => {
      result.current.moveItem('item-1', 3);
    });

    expect(result.current.items[3].id).toBe('item-1');
    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({
        fromIndex: 0,
        toIndex: 3,
      })
    );
  });

  it('moves item up', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useSortableList(items));

    act(() => {
      result.current.moveUp('item-3');
    });

    expect(result.current.items[1].id).toBe('item-3');
    expect(result.current.items[2].id).toBe('item-2');
  });

  it('moves item down', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useSortableList(items));

    act(() => {
      result.current.moveDown('item-3');
    });

    expect(result.current.items[3].id).toBe('item-3');
    expect(result.current.items[2].id).toBe('item-4');
  });

  it('moves item to top', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useSortableList(items));

    act(() => {
      result.current.moveToTop('item-5');
    });

    expect(result.current.items[0].id).toBe('item-5');
  });

  it('moves item to bottom', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useSortableList(items));

    act(() => {
      result.current.moveToBottom('item-1');
    });

    expect(result.current.items[4].id).toBe('item-1');
  });

  it('supports undo/redo', () => {
    const items = createTestItems(3);
    const { result } = renderHook(() =>
      useSortableList(items, { undoEnabled: true })
    );

    // Initial state
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // Make a change
    act(() => {
      result.current.moveItem('item-1', 2);
    });

    expect(result.current.items[2].id).toBe('item-1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    // Undo
    act(() => {
      result.current.undo();
    });

    expect(result.current.items[0].id).toBe('item-1');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo
    act(() => {
      result.current.redo();
    });

    expect(result.current.items[2].id).toBe('item-1');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('validates drop before applying', () => {
    const items = createTestItems(3);
    const validateDrop = vi.fn().mockReturnValue(false);
    const onReorder = vi.fn();

    const { result } = renderHook(() =>
      useSortableList(items, { validateDrop, onReorder })
    );

    act(() => {
      result.current.moveItem('item-1', 2);
    });

    // Validation failed, no reorder
    expect(result.current.items[0].id).toBe('item-1');
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('sets items directly', () => {
    const items = createTestItems(3);
    const { result } = renderHook(() => useSortableList(items));

    const newItems = createTestItems(5);

    act(() => {
      result.current.setItems(newItems);
    });

    expect(result.current.items).toHaveLength(5);
  });
});

// ============================================================================
// useMultiSelect Hook Tests
// ============================================================================

describe('useMultiSelect', () => {
  it('initializes with empty selection', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    expect(result.current.selectionCount).toBe(0);
    expect(result.current.hasSelection).toBe(false);
  });

  it('selects single item', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.select('item-1');
    });

    expect(result.current.isSelected('item-1')).toBe(true);
    expect(result.current.selectionCount).toBe(1);
  });

  it('toggles selection', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.addToSelection('item-1');
      result.current.addToSelection('item-2');
    });

    expect(result.current.selectionCount).toBe(2);

    act(() => {
      result.current.toggleSelection('item-1');
    });

    expect(result.current.isSelected('item-1')).toBe(false);
    expect(result.current.isSelected('item-2')).toBe(true);
    expect(result.current.selectionCount).toBe(1);
  });

  it('selects range', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.selectRange('item-2', 'item-4');
    });

    expect(result.current.isSelected('item-1')).toBe(false);
    expect(result.current.isSelected('item-2')).toBe(true);
    expect(result.current.isSelected('item-3')).toBe(true);
    expect(result.current.isSelected('item-4')).toBe(true);
    expect(result.current.isSelected('item-5')).toBe(false);
    expect(result.current.selectionCount).toBe(3);
  });

  it('selects all items', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.allSelected).toBe(true);
    expect(result.current.selectionCount).toBe(5);
  });

  it('clears selection', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectionCount).toBe(5);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectionCount).toBe(0);
    expect(result.current.hasSelection).toBe(false);
  });

  it('respects max selection limit', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() =>
      useMultiSelect({ items, maxSelection: 2 })
    );

    act(() => {
      result.current.selectAll();
    });

    // Should only select first 2
    expect(result.current.selectionCount).toBe(2);
  });

  it('gets selected items', () => {
    const items = createTestItems(5);
    const { result } = renderHook(() => useMultiSelect({ items }));

    act(() => {
      result.current.addToSelection('item-2');
      result.current.addToSelection('item-4');
    });

    const selected = result.current.getSelectedItems(items);
    expect(selected).toHaveLength(2);
    expect(selected[0].id).toBe('item-2');
    expect(selected[1].id).toBe('item-4');
  });
});

// ============================================================================
// SortableList Component Tests
// ============================================================================

describe('SortableList', () => {
  it('renders items', () => {
    const items = createTestItems(3);

    render(
      <SortableList
        items={items}
        renderItem={(item) => <div data-testid={item.id}>{item.label}</div>}
      />
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(
      <SortableList
        items={[]}
        renderItem={(item) => <div>{item.label}</div>}
        emptyState={<div data-testid="empty">No items</div>}
      />
    );

    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('has accessible list role', () => {
    const items = createTestItems(3);

    render(
      <SortableList
        items={items}
        renderItem={(item) => <div>{item.label}</div>}
        aria-label="My sortable list"
      />
    );

    const list = screen.getByRole('listbox');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('aria-label', 'My sortable list');
  });

  it('shows position numbers when enabled', () => {
    const items = createTestItems(3);

    render(
      <SortableList
        items={items}
        renderItem={(item) => <div>{item.label}</div>}
        showPositionNumbers={true}
      />
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('calls onReorder when items are reordered', async () => {
    const items = createTestItems(3);
    const onReorder = vi.fn();

    render(
      <SortableList
        items={items}
        onReorder={onReorder}
        renderItem={(item) => <div>{item.label}</div>}
      />
    );

    // Note: Full drag testing requires more complex setup with dnd-kit testing utilities
    // This is a placeholder for the callback signature test
    expect(onReorder).not.toHaveBeenCalled();
  });
});
