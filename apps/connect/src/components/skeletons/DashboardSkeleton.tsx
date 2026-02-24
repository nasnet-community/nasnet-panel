/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for the main dashboard page.
 * Matches the layout of the dashboard with cards, metrics, and charts.
 *
 * @module @/components/skeletons/DashboardSkeleton
 */

import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
 cn } from '@nasnet/ui/primitives';

export interface DashboardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * DashboardSkeleton Component
 *
 * Provides a skeleton layout matching the dashboard page structure:
 * - Header with title and actions
 * - Status summary cards (4 cards)
 * - Main content area with chart
 * - Recent activity section
 *
 * @example
 * ```tsx
 * // Use as Suspense fallback
 * <SuspenseBoundary name="Dashboard" fallback={<DashboardSkeleton />}>
 *   <Dashboard />
 * </SuspenseBoundary>
 * ```
 */
export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div
      className={cn('space-y-6 p-component-lg', className)}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 gap-component-md sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card-sm border border-border bg-card p-component-md"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <SkeletonChart
            showTitle
            showLegend
            height={300}
            className="rounded-card-sm border border-border bg-card p-component-md"
          />
        </div>

        {/* Quick Actions / Status Panel */}
        <div className="space-y-4">
          <SkeletonCard
            showTitle
            showFooter
            contentHeight={80}
          />
          <SkeletonCard
            showTitle
            contentHeight={100}
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-card-sm border border-border bg-card p-component-md">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

DashboardSkeleton.displayName = 'DashboardSkeleton';
