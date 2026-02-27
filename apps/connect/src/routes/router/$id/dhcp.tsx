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
    <div
      className="space-y-4 p-4 md:p-6 animate-fade-in-up"
      aria-busy="true"
      aria-label="Loading DHCP configuration"
    >
      {/* Header with category accent */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="h-8 w-1 rounded bg-dhcp" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Pool configuration grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>

      {/* Leases table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
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
