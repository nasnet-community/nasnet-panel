import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

import { LazyPluginStoreTab } from '@/app/routes/router-panel/tabs/lazy';

/**
 * Plugin Store Route - Code-split for optimal bundle size
 *
 * The PluginStoreTab is lazy-loaded as it contains plugin cards and
 * marketplace components. Preloading happens on hover via
 * preloadPluginStoreTab in the navigation component.
 *
 * @see NAS-4.12: Performance Optimization
 */
function PluginStoreTabSkeleton() {
  return (
    <div
      className="animate-fade-in-up space-y-4 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading plugin store"
    >
      {/* Header with category accent */}
      <div className="border-border flex items-center gap-3 border-b pb-3">
        <div className="bg-plugins h-8 w-1 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Plugin cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border-border space-y-3 rounded-lg border p-4"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PluginStoreRoute() {
  const { id: routerId } = Route.useParams();
  return (
    <LazyBoundary fallback={<PluginStoreTabSkeleton />}>
      <LazyPluginStoreTab routerId={routerId} />
    </LazyBoundary>
  );
}

export const Route = createFileRoute('/router/$id/plugins')({
  component: PluginStoreRoute,
});
