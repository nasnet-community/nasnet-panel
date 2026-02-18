import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

import { LazyFirewallTab } from '@/app/routes/router-panel/tabs/lazy';

/**
 * Firewall Route - Code-split for optimal bundle size
 *
 * The FirewallTab is lazy-loaded as it contains heavy virtualized tables
 * for firewall rule management. Preloading happens on hover via
 * preloadFirewallTab in the navigation component.
 *
 * @see NAS-4.12: Performance Optimization
 */
function FirewallTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export const Route = createFileRoute('/router/$id/firewall')({
  component: () => (
    <LazyBoundary fallback={<FirewallTabSkeleton />}>
      <LazyFirewallTab />
    </LazyBoundary>
  ),
});
