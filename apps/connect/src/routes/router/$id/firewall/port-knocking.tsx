/**
 * Port Knocking Route
 *
 * Route configuration for the Port Knocking management page.
 * Lazy-loads the PortKnockingPage component for optimal bundle size.
 *
 * @see NAS-7.12: Implement Port Knocking - Task 5
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the PortKnockingPage component
const LazyPortKnockingPage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.PortKnockingPage,
  }))
);

/**
 * Loading skeleton for PortKnockingPage
 */
function PortKnockingPageSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-fade-in-up" aria-busy="true" aria-label="Loading port knocking configuration">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/port-knocking')({
  component: () => (
    <LazyBoundary fallback={<PortKnockingPageSkeleton />}>
      <LazyPortKnockingPage />
    </LazyBoundary>
  ),
});
