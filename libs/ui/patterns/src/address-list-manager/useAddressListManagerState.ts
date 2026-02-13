/**
 * useAddressListManagerState Hook
 *
 * Headless hook containing UI state logic for AddressListManager.
 * Contains ONLY UI state (expansion, selection) - NO data fetching.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */

import { useState, useCallback } from 'react';

/**
 * Return type for useAddressListManagerState hook
 */
export interface UseAddressListManagerStateReturn {
  // Expansion state
  expandedLists: Set<string>;
  isExpanded: (listName: string) => boolean;
  toggleExpanded: (listName: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Selection state (for bulk operations)
  selectedLists: Set<string>;
  isSelected: (listName: string) => boolean;
  toggleSelected: (listName: string) => void;
  selectAll: (listNames: string[]) => void;
  clearSelection: () => void;

  // Rules modal state
  selectedListForRules: string | null;
  showRulesForList: (listName: string) => void;
  closeRulesModal: () => void;
}

/**
 * Headless hook for AddressListManager UI STATE ONLY
 *
 * Does NOT fetch data - receives data via component props.
 * Contains expansion state, selection state, and modal management.
 *
 * @example
 * ```tsx
 * function AddressListManagerDesktop(props: AddressListManagerProps) {
 *   const state = useAddressListManagerState();
 *
 *   return (
 *     <div>
 *       {props.lists.map(list => (
 *         <ListRow
 *           key={list.name}
 *           expanded={state.isExpanded(list.name)}
 *           onToggle={() => state.toggleExpanded(list.name)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAddressListManagerState(): UseAddressListManagerStateReturn {
  // Expansion state - tracks which lists are expanded to show entries
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  // Selection state - tracks which lists are selected for bulk operations
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());

  // Rules modal state - tracks which list to show referencing rules for
  const [selectedListForRules, setSelectedListForRules] = useState<string | null>(null);

  // Expansion handlers
  const toggleExpanded = useCallback((listName: string) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listName)) {
        next.delete(listName);
      } else {
        next.add(listName);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (listName: string) => expandedLists.has(listName),
    [expandedLists]
  );

  const expandAll = useCallback(() => {
    // Expand all will be called with list names from parent
    // This is a placeholder implementation
    setExpandedLists(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedLists(new Set());
  }, []);

  // Selection handlers
  const toggleSelected = useCallback((listName: string) => {
    setSelectedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listName)) {
        next.delete(listName);
      } else {
        next.add(listName);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (listName: string) => selectedLists.has(listName),
    [selectedLists]
  );

  const selectAll = useCallback((listNames: string[]) => {
    setSelectedLists(new Set(listNames));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLists(new Set());
  }, []);

  // Rules modal handlers
  const showRulesForList = useCallback((listName: string) => {
    setSelectedListForRules(listName);
  }, []);

  const closeRulesModal = useCallback(() => {
    setSelectedListForRules(null);
  }, []);

  return {
    // Expansion state
    expandedLists,
    isExpanded,
    toggleExpanded,
    expandAll,
    collapseAll,

    // Selection state
    selectedLists,
    isSelected,
    toggleSelected,
    selectAll,
    clearSelection,

    // Rules modal state
    selectedListForRules,
    showRulesForList,
    closeRulesModal,
  };
}
