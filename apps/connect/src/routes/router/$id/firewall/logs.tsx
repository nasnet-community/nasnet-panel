/**
 * Firewall Logs Route
 * Task #11: Routing and Navigation for Firewall Logs
 *
 * Route: /router/:id/firewall/logs
 *
 * Displays firewall log entries with filtering, statistics, and real-time updates.
 */

import { createFileRoute } from '@tanstack/react-router';

import { FirewallLogsPage } from '@nasnet/features/firewall';

export const Route = createFileRoute('/router/$id/firewall/logs')({
  component: FirewallLogsPage,
});
