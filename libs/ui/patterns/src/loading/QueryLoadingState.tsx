/**
 * QueryLoadingState Component
 *
 * Unified loading state component for Apollo/TanStack Query results.
 * Handles initial loading, revalidation, error, and success states.
 *
 * @module @nasnet/ui/patterns/loading
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { LoadingSpinner } from './LoadingSpinner';
import { RefreshIndicator } from './RefreshIndicator';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Default empty check
// ============================================================================

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).length === 0;
  }
  return !data;
}

// ============================================================================
// QueryLoadingState Component
// ============================================================================

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
export function QueryLoadingState<T>({
  data,
  isLoading,
  isRevalidating = false,
  error,
  skeleton,
  errorComponent,
  emptyComponent,
  isEmpty = defaultIsEmpty,
  children,
  showRefreshIndicator = true,
  className,
}: QueryLoadingStateProps<T>) {
  // Error state
  if (error) {
    if (errorComponent) {
      return (
        <div className={className}>
          {typeof errorComponent === 'function'
            ? errorComponent(error)
            : errorComponent}
        </div>
      );
    }

    return (
      <div
        role="alert"
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
      >
        <p className="text-destructive font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  // Initial loading state
  if (isLoading && !data) {
    if (skeleton) {
      return (
        <div aria-busy="true" aria-live="polite" className={className}>
          {skeleton}
        </div>
      );
    }

    return (
      <div aria-busy="true" aria-live="polite" className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" showLabel label="Loading..." />
      </div>
    );
  }

  // No data after loading
  if (!data) {
    return null;
  }

  // Empty state
  if (emptyComponent && isEmpty(data)) {
    return <div className={className}>{emptyComponent}</div>;
  }

  // Success state with data
  return (
    <div className={cn('relative', className)}>
      {/* Revalidation indicator */}
      {showRefreshIndicator && isRevalidating && (
        <RefreshIndicator isRefreshing={isRevalidating} />
      )}

      {/* Content with data */}
      {children(data)}
    </div>
  );
}

QueryLoadingState.displayName = 'QueryLoadingState';
