/**
 * DHCP Server Detail Route
 * Route: /network/dhcp/$serverId
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { createFileRoute } from '@tanstack/react-router';
import { DHCPServerDetail } from '@nasnet/features/network';

export const Route = createFileRoute('/network/dhcp/$serverId')({
  component: DHCPServerDetail,
});
