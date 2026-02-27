import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

import { LazyDnsTab } from '@/app/routes/router-panel/tabs/lazy';

/**
 * DNS Route - Code-split for optimal bundle size
 *
 * The DnsTab is lazy-loaded as it contains DNS server management,
 * static entries tables, and configuration forms.
 * Preloading happens on hover via preloadDnsTab in the navigation component.
 *
 * @see NAS-6.4: DNS Configuration
 */
function DnsTabSkeleton() {
  return (
    <div
      className="animate-fade-in-up space-y-6 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading DNS configuration"
    >
      {/* Header with category accent */}
      <div className="border-border flex items-center gap-3 border-b pb-2">
        <div className="bg-networking h-8 w-1 rounded" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/router/$id/dns')({
  component: () => (
    <LazyBoundary fallback={<DnsTabSkeleton />}>
      <LazyDnsTab />
    </LazyBoundary>
  ),
});
