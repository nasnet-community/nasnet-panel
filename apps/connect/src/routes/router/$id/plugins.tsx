import { createFileRoute } from '@tanstack/react-router';
import { LazyBoundary } from '@nasnet/ui/patterns';
import { LazyPluginStoreTab } from '@/app/routes/router-panel/tabs/lazy';
import { Skeleton } from '@nasnet/ui/primitives';

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
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/router/$id/plugins')({
  component: () => (
    <LazyBoundary fallback={<PluginStoreTabSkeleton />}>
      <LazyPluginStoreTab />
    </LazyBoundary>
  ),
});
