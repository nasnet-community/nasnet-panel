/**
 * ResourceListSkeleton Component
 *
 * Loading skeleton for resource list/table views.
 * Used for VPN servers, firewall rules, DHCP leases, etc.
 *
 * @module @/components/skeletons/ResourceListSkeleton
 */

import {
  Skeleton,
  SkeletonTable,
 cn } from '@nasnet/ui/primitives';

export interface ResourceListSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Show search/filter bar */
  showFilters?: boolean;
  /** Show action buttons in header */
  showActions?: boolean;
  /** Show pagination */
  showPagination?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ResourceListSkeleton Component
 *
 * Provides a skeleton layout for resource list pages:
 * - Header with title and action buttons
 * - Search/filter bar
 * - Data table with rows
 * - Pagination controls
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResourceListSkeleton rows={10} columns={5} />
 *
 * // Full page skeleton
 * <ResourceListSkeleton
 *   rows={10}
 *   columns={5}
 *   showFilters
 *   showActions
 *   showPagination
 * />
 * ```
 */
export function ResourceListSkeleton({
  rows = 10,
  columns = 4,
  showFilters = true,
  showActions = true,
  showPagination = true,
  className,
}: ResourceListSkeletonProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      aria-busy="true"
      aria-label="Loading resource list"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-28" />
          </div>
        )}
      </div>

      {/* Filters/Search Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-64" /> {/* Search input */}
          <Skeleton className="h-10 w-32" /> {/* Filter dropdown */}
          <Skeleton className="h-10 w-32" /> {/* Filter dropdown */}
        </div>
      )}

      {/* Table */}
      <div className="rounded-card-sm border border-border bg-card shadow-sm">
        <SkeletonTable
          rows={rows}
          columns={columns}
          showHeader
          className="p-component-md"
        />
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" /> {/* "Showing X of Y" */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      )}
    </div>
  );
}

ResourceListSkeleton.displayName = 'ResourceListSkeleton';
