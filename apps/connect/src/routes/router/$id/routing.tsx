/**
 * Device-to-Service Routing Route (NAS-8.3)
 *
 * Route devices through service instances (Tor, Xray, etc.) using Policy-Based Routing.
 * Provides device discovery, service assignment, and real-time routing updates.
 */

import { createFileRoute } from '@tanstack/react-router';
import { DeviceRoutingPage } from '@nasnet/features/services';

export const Route = createFileRoute('/router/$id/routing')({
  component: DeviceRoutingPageRoute,
});

/**
 * Route component wrapper
 * Extracts routerId from route params and passes to DeviceRoutingPage
 */
function DeviceRoutingPageRoute() {
  const { id: routerId } = Route.useParams();

  return <DeviceRoutingPage routerId={routerId} />;
}
