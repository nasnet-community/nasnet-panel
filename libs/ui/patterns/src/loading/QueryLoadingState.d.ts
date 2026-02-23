/**
 * QueryLoadingState Component
 *
 * Unified loading state component for Apollo/TanStack Query results.
 * Handles initial loading, revalidation, error, and success states.
 *
 * @module @nasnet/ui/patterns/loading
 */
import * as React from 'react';
export interface QueryLoadingStateProps<T> {
    /** Query data */
    data: T | undefined;
    /** Whether the query is loading (initial load) */
    isLoading: boolean;
    /** Whether the query is revalidating (background refresh) */
    isRevalidating?: boolean;
    /** Query error */
    error?: Error | null;
    /** Skeleton component to show during initial load */
    skeleton?: React.ReactNode;
    /** Error component to show on error */
    errorComponent?: React.ReactNode | ((error: Error) => React.ReactNode);
    /** Empty state component when data is empty */
    emptyComponent?: React.ReactNode;
    /** Function to check if data is empty */
    isEmpty?: (data: T) => boolean;
    /** Children render function with data */
    children: (data: T) => React.ReactNode;
    /** Show refresh indicator during revalidation */
    showRefreshIndicator?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * QueryLoadingState Component
 *
 * Handles all loading states for query results in a consistent way.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <QueryLoadingState
 *   data={data}
 *   isLoading={isLoading}
 *   error={error}
 *   skeleton={<ResourceListSkeleton />}
 * >
 *   {(data) => <ResourceList data={data} />}
 * </QueryLoadingState>
 *
 * // With revalidation indicator
 * <QueryLoadingState
 *   data={data}
 *   isLoading={isInitialLoading}
 *   isRevalidating={isRevalidating}
 *   showRefreshIndicator
 *   skeleton={<TableSkeleton />}
 * >
 *   {(data) => <DataTable data={data} />}
 * </QueryLoadingState>
 *
 * // With empty state
 * <QueryLoadingState
 *   data={items}
 *   isLoading={isLoading}
 *   emptyComponent={<EmptyState message="No items found" />}
 *   isEmpty={(items) => items.length === 0}
 * >
 *   {(items) => <ItemList items={items} />}
 * </QueryLoadingState>
 * ```
 */
declare function QueryLoadingStateComponent<T>({ data, isLoading, isRevalidating, error, skeleton, errorComponent, emptyComponent, isEmpty, children, showRefreshIndicator, className, }: QueryLoadingStateProps<T>): import("react/jsx-runtime").JSX.Element | null;
declare const QueryLoadingState: typeof QueryLoadingStateComponent;
export { QueryLoadingState };
//# sourceMappingURL=QueryLoadingState.d.ts.map