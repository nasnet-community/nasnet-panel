/**
 * VLAN Settings Route (NAS-8.18)
 *
 * VLAN pool configuration, allocation monitoring, and orphan cleanup.
 *
 * Route: /router/:id/vlans
 */

import { createFileRoute } from '@tanstack/react-router';

import { VLANSettingsPage } from '@nasnet/features/services';

export const Route = createFileRoute('/router/$id/vlans')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: routerId } = Route.useParams();
  return <VLANSettingsPage routerID={routerId} />;
}
