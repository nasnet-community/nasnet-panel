/**
 * InstanceManager Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <InstanceManager
 *   instances={instances}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   onBulkOperation={(operation, ids) => {
 *     console.log(`Performing ${operation} on`, ids);
 *   }}
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   showMetrics={true}
 * />
 * ```
 */
import type { InstanceManagerProps } from './types';
/**
 * InstanceManager - Manages service instances with filtering, sorting, and bulk operations
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Single column list with simplified filters
 * - Tablet/Desktop (≥640px): Data table with advanced filtering and sorting
 */
declare function InstanceManagerComponent(props: InstanceManagerProps): import("react/jsx-runtime").JSX.Element;
export declare const InstanceManager: import("react").MemoExoticComponent<typeof InstanceManagerComponent>;
export {};
//# sourceMappingURL=InstanceManager.d.ts.map