/**
 * useInterfaceSelector - Headless Hook for Interface Selection
 *
 * Contains all logic for the interface selector component:
 * - GraphQL subscription for real-time interface data
 * - Type filtering logic
 * - Search/filter by name (debounced)
 * - Selection state management (single and multi-select)
 * - Usage detection from router data
 *
 * @example
 * ```tsx
 * const state = useInterfaceSelector({
 *   routerId: 'router-1',
 *   value: selectedInterface,
 *   onChange: setSelectedInterface,
 *   multiple: false,
 * });
 * ```
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import type { InterfaceSelectorProps, UseInterfaceSelectorReturn } from './interface-selector.types';
/**
 * Headless hook for interface selector component.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018):
 * - Contains ALL logic (state, filtering, selection, data fetching)
 * - No rendering - returns state and handlers for presenters
 * - Platform-agnostic - same hook for mobile and desktop
 *
 * @param config - InterfaceSelectorProps configuration
 * @returns UseInterfaceSelectorReturn with all state and handlers
 */
export declare function useInterfaceSelector(config: InterfaceSelectorProps): UseInterfaceSelectorReturn;
export default useInterfaceSelector;
//# sourceMappingURL=use-interface-selector.d.ts.map