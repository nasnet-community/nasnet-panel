/**
 * DHCP Server List Route
 * Route: /network/dhcp
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { createFileRoute } from '@tanstack/react-router';
import { DHCPServerList } from '@nasnet/features/network';

export const Route = createFileRoute('/network/dhcp/')({
  component: DHCPServerList,
});
