/**
 * Sortable Context
 *
 * React context for sharing sortable state between components.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import * as React from 'react';
import type { SortableContextValue, SortableItemData } from './types';
export declare const SortableContext: React.Context<SortableContextValue<SortableItemData> | null>;
/**
 * Get sortable context (throws if not within SortableList)
 */
export declare function useSortableContext<T extends SortableItemData = SortableItemData>(): SortableContextValue<T>;
/**
 * Get sortable context (returns null if not within SortableList)
 */
export declare function useSortableContextOptional<T extends SortableItemData = SortableItemData>(): SortableContextValue<T> | null;
export default SortableContext;
//# sourceMappingURL=context.d.ts.map