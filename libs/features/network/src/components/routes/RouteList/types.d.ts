/**
 * RouteList Component Types
 * NAS-6.5: Static Route Management
 */
import type { Route, RouteType } from '@nasnet/api-client/generated';
/**
 * Filter options for route list
 */
export interface RouteFilters {
    /** Filter by routing table */
    table?: string;
    /** Filter by route type */
    type?: RouteType;
    /** Search text for destination, gateway, or comment */
    searchText?: string;
    /** Filter by active status */
    activeOnly?: boolean;
}
/**
 * Sort options for route list
 */
export interface RouteSortOptions {
    /** Field to sort by */
    field: 'destination' | 'gateway' | 'interface' | 'distance' | 'type';
    /** Sort direction */
    direction: 'asc' | 'desc';
}
/**
 * Actions available on each route
 */
export interface RouteActions {
    /** Callback for editing a route */
    onEdit?: (route: Route) => void;
    /** Callback for deleting a route */
    onDelete?: (route: Route) => void;
    /** Callback for toggling disabled state */
    onToggleDisabled?: (route: Route) => void;
}
/**
 * Props for RouteList component (both Desktop and Mobile)
 */
export interface RouteListProps extends RouteActions {
    /** Router ID to fetch routes from */
    routerId: string;
    /** List of routes to display */
    routes: Route[];
    /** Loading state */
    loading?: boolean;
    /** Error message if query failed */
    error?: string;
    /** Current filter settings */
    filters: RouteFilters;
    /** Current sort options */
    sortOptions: RouteSortOptions;
    /** Available routing tables (computed from routes) */
    availableTables: string[];
    /** Callback when filters change */
    onFiltersChange: (filters: RouteFilters) => void;
    /** Callback when sort changes */
    onSortChange: (sortOptions: RouteSortOptions) => void;
    /** Callback for refreshing the list */
    onRefresh?: () => void;
}
//# sourceMappingURL=types.d.ts.map