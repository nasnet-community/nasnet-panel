/**
 * RouteList Pattern Component
 * NAS-6.5: Static Route Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RouteList
 *   routerId={routerId}
 *   routes={routes}
 *   loading={loading}
 *   filters={filters}
 *   sortOptions={sortOptions}
 *   availableTables={availableTables}
 *   onFiltersChange={setFilters}
 *   onSortChange={setSortOptions}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
import type { RouteListProps } from './types';
/**
 * RouteList - Display and manage static routes
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with filtering and sorting
 *
 * @description Headless + Platform Presenters pattern with adaptive layouts for routes
 */
declare function RouteListComponent(props: RouteListProps): import("react/jsx-runtime").JSX.Element;
declare namespace RouteListComponent {
    var displayName: string;
}
export declare const RouteList: import("react").MemoExoticComponent<typeof RouteListComponent>;
export {};
//# sourceMappingURL=RouteList.d.ts.map