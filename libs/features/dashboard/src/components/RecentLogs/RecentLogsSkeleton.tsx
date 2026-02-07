/**
 * RecentLogsSkeleton component for loading state
 * Respects prefers-reduced-motion for accessibility
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@nasnet/ui/primitives';

import type { RecentLogsSkeletonProps } from './types';

/**
 * Loading skeleton for RecentLogs component
 * Displays 3 skeleton rows matching log entry structure
 *
 * @param className - Optional CSS classes
 */
export function RecentLogsSkeleton({ className }: RecentLogsSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Logs</CardTitle>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 h-16">
            <Skeleton className="h-5 w-5 rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
