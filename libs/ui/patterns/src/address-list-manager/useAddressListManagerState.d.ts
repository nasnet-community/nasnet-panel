/**
 * useAddressListManagerState Hook
 *
 * Headless hook containing UI state logic for AddressListManager.
 * Contains ONLY UI state (expansion, selection) - NO data fetching.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
/**
 * Return type for useAddressListManagerState hook
 *
 * Contains UI state management for AddressListManager component.
 * Handles expansion state, selection state, and modal management.
 * Does NOT contain data fetching or GraphQL operations.
 */
export interface UseAddressListManagerStateReturn {
    /**
     * Set of currently expanded list names
     */
    expandedLists: Set<string>;
    /**
     * Check if a specific list is expanded
     * @param listName - Name of the list to check
     * @returns true if list is expanded
     */
    isExpanded: (listName: string) => boolean;
    /**
     * Toggle expansion state of a list
     * @param listName - Name of the list to toggle
     */
    toggleExpanded: (listName: string) => void;
    /**
     * Expand all lists (typically called when user clicks "Expand All" button)
     * Note: Implementation expands up to ~100 items for performance. Called by presenters with list names.
     */
    expandAll: () => void;
    /**
     * Collapse all lists (typically called when user clicks "Collapse All" button)
     */
    collapseAll: () => void;
    /**
     * Set of currently selected list names (for bulk operations)
     */
    selectedLists: Set<string>;
    /**
     * Check if a specific list is selected for bulk operations
     * @param listName - Name of the list to check
     * @returns true if list is selected
     */
    isSelected: (listName: string) => boolean;
    /**
     * Toggle selection state of a list
     * @param listName - Name of the list to toggle
     */
    toggleSelected: (listName: string) => void;
    /**
     * Select multiple lists at once
     * @param listNames - Array of list names to select
     */
    selectAll: (listNames: string[]) => void;
    /**
     * Clear all selections
     */
    clearSelection: () => void;
    /**
     * Name of the list currently showing referencing rules (in modal)
     */
    selectedListForRules: string | null;
    /**
     * Open the referencing rules modal for a specific list
     * @param listName - Name of the list to show rules for
     */
    showRulesForList: (listName: string) => void;
    /**
     * Close the referencing rules modal
     */
    closeRulesModal: () => void;
}
/**
 * Headless hook for AddressListManager UI state management
 *
 * **CRITICAL:** Does NOT fetch data - receives data via component props.
 * **PURPOSE:** Manages UI state only (expansion, selection, modals).
 *
 * Responsibilities:
 * - Track which lists are expanded (to show entries inline or in Sheet)
 * - Track which lists are selected for bulk operations
 * - Track which list's referencing rules are being shown in modal
 *
 * Data fetching (GraphQL queries) is handled by Layer 3 (Domain) component,
 * NOT by this hook. This keeps concerns separated and enables reusability.
 *
 * @returns UI state object with expansion/selection/modal management
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
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
export declare function useAddressListManagerState(): UseAddressListManagerStateReturn;
//# sourceMappingURL=useAddressListManagerState.d.ts.map