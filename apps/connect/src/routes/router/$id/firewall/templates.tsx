/**
 * Firewall Templates Route
 *
 * Route configuration for the Firewall Templates management page.
 * Lazy-loads the TemplatesPage component for optimal bundle size.
 *
 * @see NAS-7.6: Implement Firewall Templates - Tasks 3-7
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the TemplatesPage component
const LazyTemplatesPage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.TemplatesPage,
  }))
);

/**
 * Loading skeleton for TemplatesPage
 */
function TemplatesPageSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in-up" aria-busy="true" aria-label="Loading firewall templates">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/templates')({
  component: TemplatesRoute,
});

export function TemplatesRoute() {
  const { id } = Route.useParams();
  return (
    <LazyBoundary fallback={<TemplatesPageSkeleton />}>
      <LazyTemplatesPage routerId={id} />
    </LazyBoundary>
  );
}
