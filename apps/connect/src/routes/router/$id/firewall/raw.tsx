/**
 * RAW Rules Route
 *
 * Route configuration for the RAW Firewall Rules management page.
 * Lazy-loads the RawPage component for optimal bundle size.
 *
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 12
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the RawPage component
const LazyRawPage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.RawPage,
  }))
);

/**
 * Loading skeleton for RawPage
 */
function RawPageSkeleton() {
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
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/raw')({
  component: () => (
    <LazyBoundary fallback={<RawPageSkeleton />}>
      <LazyRawPage />
    </LazyBoundary>
  ),
});
