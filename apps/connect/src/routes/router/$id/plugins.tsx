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
      className="space-y-4 p-4 md:p-6 animate-fade-in-up"
      aria-busy="true"
      aria-label="Loading plugin store"
    >
      {/* Header with category accent */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="h-8 w-1 rounded bg-plugins" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Plugin cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
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
