/**
 * VLAN Management Route
 *
 * Route: /router/:id/vlans
 * Story: NAS-6.7 - Implement VLAN Management
 */

import { createFileRoute } from '@tanstack/react-router';
import { VlanManagementPage } from '@/app/pages/VlanManagementPage';

export const Route = createFileRoute('/router/$id/vlans')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: routerId } = Route.useParams();
  return <VlanManagementPage routerId={routerId} />;
}
