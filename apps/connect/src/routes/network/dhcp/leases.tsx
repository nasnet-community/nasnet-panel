/**
 * DHCP Lease Management Route
 * NAS-6.11 DHCP Lease Management
 *
 * Route definition for DHCP lease management page
 * Path: /network/dhcp/leases
 */

import { createFileRoute } from '@tanstack/react-router';
import { DHCPLeaseManagementPage } from '@nasnet/features/network';

export const Route = createFileRoute('/network/dhcp/leases')({
  component: DHCPLeaseManagementPage,
  meta: () => [
    {
      title: 'DHCP Leases',
      breadcrumb: [
        { label: 'Network', href: '/network' },
        { label: 'DHCP', href: '/network/dhcp' },
        { label: 'Leases', href: '/network/dhcp/leases' },
      ],
    },
  ],
});
