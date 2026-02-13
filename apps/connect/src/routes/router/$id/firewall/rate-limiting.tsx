/**
 * Rate Limiting Route
 *
 * Route configuration for the Rate Limiting management page.
 * Lazy-loads the RateLimitingPage component for optimal bundle size.
 *
 * @see NAS-7.6: Implement Rate Limiting - Task 8
 */

import { createFileRoute } from '@tanstack/react-router';
import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';
import { lazy } from 'react';

// Lazy-load the RateLimitingPage component
const LazyRateLimitingPage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.RateLimitingPage,
  }))
);

/**
 * Loading skeleton for RateLimitingPage
 */
function RateLimitingPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/rate-limiting')({
  component: () => (
    <LazyBoundary fallback={<RateLimitingPageSkeleton />}>
      <LazyRateLimitingPage />
    </LazyBoundary>
  ),
});
