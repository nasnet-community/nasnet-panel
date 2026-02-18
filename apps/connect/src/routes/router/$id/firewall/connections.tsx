/**
 * Connections Route
 * NAS-7.4: Connection Tracking - Route Layer
 *
 * Route: /router/:id/firewall/connections
 */

import { createFileRoute } from '@tanstack/react-router';

import { ConnectionsPage } from '@nasnet/features/firewall';

export const Route = createFileRoute('/router/$id/firewall/connections')({
  component: ConnectionsPage,
});
