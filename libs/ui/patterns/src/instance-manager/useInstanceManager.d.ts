/**
 * useInstanceManager Hook
 *
 * Headless hook containing all business logic for InstanceManager.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { InstanceManagerProps, InstanceFilters, InstanceSort, BulkOperation, BulkAction } from './types';
import type { Service } from '../service-card/types';
/**
 * Return type for useInstanceManager hook
 */
export interface UseInstanceManagerReturn {
    filteredInstances: Service[];
    totalCount: number;
    filteredCount: number;
    selectedIds: string[];
    selectedCount: number;
    allSelected: boolean;
    someSelected: boolean;
    activeFilters: InstanceFilters;
    hasActiveFilters: boolean;
    activeSort: InstanceSort;
    availableBulkActions: BulkAction[];
    canPerformBulkOperation: boolean;
    handleSelectAll: () => void;
    handleClearSelection: () => void;
    handleToggleSelection: (id: string) => void;
    handleInstanceClick: (instance: Service) => void;
    handleBulkOperation: (operation: BulkOperation) => void;
    handleFilterChange: (filters: Partial<InstanceFilters>) => void;
    handleSortChange: (field: InstanceSort['field']) => void;
    handleClearFilters: () => void;
}
/**
 * Headless hook for InstanceManager pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 */
export declare function useInstanceManager(props: InstanceManagerProps): UseInstanceManagerReturn;
//# sourceMappingURL=useInstanceManager.d.ts.map