/**
 * DNS Diagnostics Route
 * Route: /network/dns/diagnostics
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 7: Create DNS Diagnostics Page Route
 */

import { createFileRoute } from '@tanstack/react-router';

import { DnsDiagnosticsPage } from '@nasnet/features/network';

export const Route = createFileRoute('/network/dns/diagnostics')({
  component: DnsDiagnosticsPage,
});
