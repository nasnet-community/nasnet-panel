/**
 * DHCP Wizard Route
 * Route: /network/dhcp/new
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { createFileRoute } from '@tanstack/react-router';

import { DHCPWizard } from '@nasnet/features/network';

export const Route = createFileRoute('/network/dhcp/new')({
  component: DHCPWizard,
});
