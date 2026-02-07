import { createFileRoute } from '@tanstack/react-router';
import { LazyBoundary } from '@nasnet/ui/patterns';
import { LazyDnsTab } from '@/app/routes/router-panel/tabs/lazy';
import { Skeleton } from '@nasnet/ui/primitives';

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
    <div className="space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
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
