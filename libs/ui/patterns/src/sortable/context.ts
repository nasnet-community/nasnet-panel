/**
 * Sortable Context
 *
 * React context for sharing sortable state between components.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import * as React from 'react';

import type { SortableContextValue, SortableItemData } from './types';

// ============================================================================
// Context
// ============================================================================

export const SortableContext = React.createContext<SortableContextValue | null>(null);

SortableContext.displayName = 'SortableContext';

// ============================================================================
// Hook
// ============================================================================

/**
 * Get sortable context (throws if not within SortableList)
 */
export function useSortableContext<T extends SortableItemData = SortableItemData>(): SortableContextValue<T> {
  const context = React.useContext(SortableContext);

  if (!context) {
    throw new Error('useSortableContext must be used within a SortableList');
  }

  return context as SortableContextValue<T>;
}

/**
 * Get sortable context (returns null if not within SortableList)
 */
export function useSortableContextOptional<T extends SortableItemData = SortableItemData>(): SortableContextValue<T> | null {
  return React.useContext(SortableContext) as SortableContextValue<T> | null;
}

export default SortableContext;
