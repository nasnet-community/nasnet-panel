import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

import { LazyLogsTab } from '@/app/routes/router-panel/tabs/lazy';

/**
 * Logs Route - Code-split for optimal bundle size
 *
 * The LogsTab is lazy-loaded as it contains heavy virtualized log list
 * and log filtering components. Preloading happens on hover via
 * preloadLogsTab in the navigation component.
 *
 * @see NAS-4.12: Performance Optimization
 */
function LogsTabSkeleton() {
  return (
    <div
      className="animate-fade-in-up space-y-4 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading logs"
    >
      {/* Header with category accent */}
      <div className="border-border flex items-center gap-3 border-b pb-3">
        <div className="bg-logs h-8 w-1 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Filter controls skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      {/* Logs table skeleton */}
      <div className="border-border overflow-hidden rounded-lg border">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/router/$id/logs')({
  component: () => (
    <LazyBoundary fallback={<LogsTabSkeleton />}>
      <LazyLogsTab />
    </LazyBoundary>
  ),
});
