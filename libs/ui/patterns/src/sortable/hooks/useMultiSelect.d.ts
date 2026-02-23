/**
 * useMultiSelect Hook
 *
 * Manages multi-selection state for sortable lists.
 * Supports Shift+click for range selection and Ctrl/Cmd+click for toggle.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import type { SortableItemData } from '../types';
import type { UniqueIdentifier } from '@dnd-kit/core';
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
export declare function useMultiSelect<T extends SortableItemData>(options: UseMultiSelectOptions<T>): UseMultiSelectReturn;
export default useMultiSelect;
//# sourceMappingURL=useMultiSelect.d.ts.map