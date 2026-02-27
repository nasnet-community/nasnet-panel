/**
 * RecentLogsSkeleton component for loading state
 * Provides visual feedback while logs are loading from server
 * Respects prefers-reduced-motion for accessibility
 * Story NAS-5.6: Recent Logs with Filtering
 *
 * @component
 * @see RecentLogs - Main component
 * @see https://docs.nasnet.io/design/COMPREHENSIVE_COMPONENT_CHECKLIST#10-loading-states
 *
 * @example
 * <RecentLogsSkeleton />
 *
 * @example
 * <RecentLogsSkeleton className="col-span-2" />
 */

import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from '@nasnet/ui/primitives';

import type { RecentLogsSkeletonProps } from './types';

/**
 * Loading skeleton for RecentLogs component
 * Displays 3 skeleton rows matching the log entry structure
 * Used during initial data loading and while fetching new logs
 *
 * @component
 * @param {RecentLogsSkeletonProps} props - Component props
 * @param {string} [props.className] - Optional CSS classes for styling
 *
 * @returns {React.ReactElement} Rendered skeleton component
 *
 * Layout:
 * - Card header with title, topic filter skeleton, and view all button skeleton
 * - Content area with 3 skeleton log entry rows
 * - Each row contains: icon (5x5px), timestamp (5x16px), duration (4x12px), message (4x full)
 *
 * Accessibility:
 * - Uses semantic Card structure
 * - Skeleton pulse animation respects prefers-reduced-motion
 * - No aria-live on skeletons (they're replaced by actual content)
 *
 * @see Skeleton - Primitive component for loading placeholders
 */
function RecentLogsSkeletonComponent({
  className,
}: RecentLogsSkeletonProps) {
  /**
   * Memoized skeleton rows to prevent re-renders
   * Creates 3 rows matching log entry visual structure
   */
  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-component-md p-component-md h-16">
          {/* Icon/severity indicator skeleton */}
          <Skeleton className="h-5 w-5 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Timestamp and duration row */}
            <div className="flex items-center gap-component-sm">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            {/* Message text skeleton */}
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      )),
    []
  );

  return (
    <Card className={className}>
      {/* Header with skeleton controls */}
      <CardHeader className="flex flex-row items-center justify-between pb-component-sm">
        <CardTitle className="text-base">Recent Logs</CardTitle>
        <div className="flex items-center gap-component-sm">
          {/* Topic filter button skeleton */}
          <Skeleton className="h-9 w-9" />
          {/* View All button skeleton */}
          <Skeleton className="h-9 w-20" />
        </div>
      </CardHeader>
      {/* Log entries skeleton */}
      <CardContent className="pt-0 space-y-component-sm">
        {skeletonRows}
      </CardContent>
    </Card>
  );
}

/**
 * RecentLogsSkeleton export with React.memo for performance optimization
 * Prevents unnecessary re-renders when parent updates but props haven't changed
 */
export const RecentLogsSkeleton = React.memo(RecentLogsSkeletonComponent);
RecentLogsSkeleton.displayName = 'RecentLogsSkeleton';
