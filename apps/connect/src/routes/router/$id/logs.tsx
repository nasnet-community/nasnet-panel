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
    <div className="space-y-4 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-96 w-full" />
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
