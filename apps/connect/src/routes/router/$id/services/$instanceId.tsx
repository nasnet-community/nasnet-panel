/**
 * Service Instance Detail Route (NAS-8.1)
 *
 * Displays detailed information for a specific service instance including
 * overview, configuration, traffic, logs, and diagnostics.
 *
 * Route: /router/:id/services/:instanceId
 */

import { createFileRoute } from '@tanstack/react-router';

import { ServiceDetailPage } from '@nasnet/features/services';

export const Route = createFileRoute('/router/$id/services/$instanceId')({
  component: ServiceDetailRoute,
});

export function ServiceDetailRoute() {
  const { id: routerId, instanceId } = Route.useParams();

  return (
    <ServiceDetailPage
      routerId={routerId}
      instanceId={instanceId}
    />
  );
}
