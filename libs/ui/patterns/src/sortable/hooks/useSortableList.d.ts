/**
 * useSortableList Hook
 *
 * Headless hook for managing sortable list state and operations.
 * Provides drag state, selection, reordering, and undo/redo capabilities.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import type { SortableItemData, UseSortableListOptions, UseSortableListReturn } from '../types';
export declare function useSortableList<T extends SortableItemData>(initialItems: T[], options?: UseSortableListOptions<T>): UseSortableListReturn<T>;
export default useSortableList;
//# sourceMappingURL=useSortableList.d.ts.map