/**
 * useRouteList - Headless Hook
 * NAS-6.5: Static Route Management
 *
 * Manages state and logic for RouteList component.
 * Provides filtering, sorting, and action handlers.
 */
import type { Route } from '@nasnet/api-client/generated';
import type { RouteFilters, RouteSortOptions, RouteListProps } from './types';
export interface UseRouteListOptions {
    /** Router ID to fetch routes from */
    routerId: string;
    /** Initial filters */
    initialFilters?: Partial<RouteFilters>;
    /** Initial sort options */
    initialSortOptions?: RouteSortOptions;
    /** Callback when route is edited */
    onEdit?: (route: Route) => void;
    /** Callback when route is deleted */
    onDelete?: (route: Route) => void;
    /** Callback when route disabled state is toggled */
    onToggleDisabled?: (route: Route) => void;
    /** Poll interval in milliseconds (default: 10000) */
    pollInterval?: number;
}
export interface UseRouteListReturn extends Omit<RouteListProps, 'routerId'> {
    /** Refetch routes from server */
    refetch: () => void;
}
/**
 * Headless hook for RouteList component
 *
 * Encapsulates all business logic for route list management including:
 * - Fetching routes from API
 * - Managing filters and sort state
 * - Computing available routing tables
 * - Handling route actions
 */
export declare function useRouteList({ routerId, initialFilters, initialSortOptions, onEdit, onDelete, onToggleDisabled, pollInterval, }: UseRouteListOptions): UseRouteListReturn;
//# sourceMappingURL=useRouteList.d.ts.map