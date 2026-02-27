/**
 * Address Lists Route
 *
 * Route configuration for the Address Lists management page.
 * Lazy-loads the AddressListView component for optimal bundle size.
 *
 * @see NAS-7.3: Implement Address Lists - Task 7
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the AddressListView component
const LazyAddressListView = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.AddressListView,
  }))
);

/**
 * Loading skeleton for AddressListView
 */
function AddressListViewSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in-up" aria-busy="true" aria-label="Loading address lists">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Route configuration
 */
export const Route = createFileRoute('/router/$id/firewall/address-lists')({
  component: () => (
    <LazyBoundary fallback={<AddressListViewSkeleton />}>
      <LazyAddressListView />
    </LazyBoundary>
  ),
});
