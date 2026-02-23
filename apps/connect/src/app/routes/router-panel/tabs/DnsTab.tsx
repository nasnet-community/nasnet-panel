/**
 * DNS Tab Component
 *
 * Story: NAS-6.4 - DNS Configuration
 * Displays DNS configuration interface including:
 * - DNS server management (static and dynamic)
 * - Cache settings and usage
 * - Static DNS entries (hostname-to-IP mappings)
 * - Remote requests security settings
 */

import { DnsPage } from '@nasnet/features/network';

/**
 * DNS Tab
 *
 * Wrapper component that renders the DNS configuration page.
 * The DnsPage component handles all DNS management functionality.
 */
export function DnsTab() {
  return <DnsPage />;
}

DnsTab.displayName = 'DnsTab';
