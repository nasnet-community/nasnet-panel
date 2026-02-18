import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

import { LazyDHCPTab } from '@/app/routes/router-panel/tabs/lazy';

/**
 * DHCP Route - Code-split for optimal bundle size
 *
 * The DHCPTab is lazy-loaded as it contains lease tables and
 * pool management components. Preloading happens on hover via
 * preloadDHCPTab in the navigation component.
 *
 * @see NAS-4.12: Performance Optimization
 */
function DHCPTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export const Route = createFileRoute('/router/$id/dhcp')({
  component: () => (
    <LazyBoundary fallback={<DHCPTabSkeleton />}>
      <LazyDHCPTab />
    </LazyBoundary>
  ),
});
