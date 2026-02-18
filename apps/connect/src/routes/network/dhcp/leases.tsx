/**
 * DHCP Lease Management Route
 * NAS-6.11 DHCP Lease Management
 *
 * Route definition for DHCP lease management page
 * Path: /network/dhcp/leases
 */

import { createFileRoute } from '@tanstack/react-router';

import { DHCPLeaseManagementPage } from '@nasnet/features/network';
import { useConnectionStore } from '@nasnet/state/stores';

function DHCPLeasesRoute() {
  const routerId = useConnectionStore((state) => state.currentRouterIp) || '';
  return <DHCPLeaseManagementPage routerId={routerId} />;
}

export const Route = createFileRoute('/network/dhcp/leases')({
  component: DHCPLeasesRoute,
});
