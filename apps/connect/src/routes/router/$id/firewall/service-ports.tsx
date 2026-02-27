/**
 * Service Ports Management Route
 *
 * Route configuration for the Service Ports management page.
 * Lazy-loads the ServicePortsPage component for managing custom service port
 * definitions and service groups. Enables users to:
 * - Define custom service names (e.g., "my-app" → port 9999)
 * - Create service groups for quick selection (e.g., "web" → ports 80, 443, 8080)
 * - Use service names instead of port numbers in firewall rules
 *
 * @see libs/features/firewall/src/pages/ServicePortsPage.tsx
 */

import { lazy } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LazyBoundary } from '@nasnet/ui/patterns';
import { Skeleton } from '@nasnet/ui/primitives';

// Lazy-load the ServicePortsPage component
const LazyServicePortsPage = lazy(() =>
  import('@nasnet/features/firewall').then((module) => ({
    default: module.ServicePortsPage,
  }))
);

/**
 * Loading skeleton for ServicePortsPage
 */
function ServicePortsPageSkeleton() {
  return (
    <div
      className="animate-fade-in-up space-y-4 p-4"
      aria-busy="true"
      aria-label="Loading service ports"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="font-display h-8 w-48" />
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
export const Route = createFileRoute('/router/$id/firewall/service-ports')({
  component: () => (
    <LazyBoundary fallback={<ServicePortsPageSkeleton />}>
      <LazyServicePortsPage />
    </LazyBoundary>
  ),
});
