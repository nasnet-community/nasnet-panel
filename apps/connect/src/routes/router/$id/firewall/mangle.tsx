/**
 * Mangle Rules Route
 *
 * Route configuration for the Mangle Rules management page.
 * Lazy-loads the ManglePage component for optimal bundle size.
 *
 * @see NAS-7.5: Implement Mangle Rules - Task 19
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the ManglePage component
const LazyManglePage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.ManglePage,
  }))
);

/**
 * Loading skeleton for ManglePage
 */
function ManglePageSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading mangle rules">
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
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/mangle')({
  component: () => (
    <LazyBoundary fallback={<ManglePageSkeleton />}>
      <LazyManglePage />
    </LazyBoundary>
  ),
});
