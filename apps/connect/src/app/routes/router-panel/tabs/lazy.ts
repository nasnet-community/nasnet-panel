/**
 * Lazy-loaded Tab Components
 *
 * Heavy tabs (Firewall, Logs, DHCP) are code-split for optimal initial load.
 * Uses createLazyWithPreload for hover-based preloading.
 *
 * Usage:
 * ```tsx
 * import { LazyFirewallTab, preloadFirewallTab } from './lazy';
 *
 * // In route definition
 * const Route = createFileRoute('/router/$id/firewall')({
 *   component: () => (
 *     <LazyBoundary fallback={<TabSkeleton />}>
 *       <LazyFirewallTab />
 *     </LazyBoundary>
 *   ),
 * });
 *
 * // Preload on hover
 * <NavLink onMouseEnter={preloadFirewallTab}>Firewall</NavLink>
 * ```
 *
 * @see NAS-4.12: Performance Optimization
 */

import { createLazyWithPreload } from '@nasnet/ui/patterns';

// ===== Heavy Tab Components =====

/**
 * Firewall Tab - Heavy due to large rule tables
 * Estimated chunk size: ~50KB
 */
export const [LazyFirewallTab, preloadFirewallTab] = createLazyWithPreload(() =>
  import('./FirewallTab').then((m) => ({ default: m.FirewallTab }))
);

/**
 * Logs Tab - Heavy due to virtualization and log processing
 * Estimated chunk size: ~40KB
 */
export const [LazyLogsTab, preloadLogsTab] = createLazyWithPreload(() =>
  import('./LogsTab').then((m) => ({ default: m.LogsTab }))
);

/**
 * DHCP Tab - Heavy due to lease table and pool management
 * Estimated chunk size: ~35KB
 */
export const [LazyDHCPTab, preloadDHCPTab] = createLazyWithPreload(() =>
  import('./DHCPTab').then((m) => ({ default: m.DHCPTab }))
);

/**
 * DNS Tab - Heavy due to server list, static entries table, and forms
 * Estimated chunk size: ~30KB
 */
export const [LazyDnsTab, preloadDnsTab] = createLazyWithPreload(() =>
  import('./DnsTab').then((m) => ({ default: m.DnsTab }))
);

/**
 * VPN Tab - Heavy due to protocol-specific components
 * Estimated chunk size: ~45KB
 */
export const [LazyVPNTab, preloadVPNTab] = createLazyWithPreload(() =>
  import('./VPNTab').then((m) => ({ default: m.VPNTab }))
);

/**
 * Plugin Store Tab - Heavy due to plugin cards and marketplace
 * Estimated chunk size: ~30KB
 */
export const [LazyPluginStoreTab, preloadPluginStoreTab] = createLazyWithPreload(() =>
  import('./PluginStoreTab').then((m) => ({ default: m.PluginStoreTab }))
);

/**
 * Network Tab - Medium complexity
 * Estimated chunk size: ~25KB
 */
export const [LazyNetworkTab, preloadNetworkTab] = createLazyWithPreload(() =>
  import('./NetworkTab').then((m) => ({ default: m.NetworkTab }))
);

// ===== Preload All Heavy Tabs =====

/**
 * Preload all heavy tabs in background
 * Call when user enters router panel to ensure fast tab switches
 */
export function preloadAllHeavyTabs(): void {
  // Use requestIdleCallback for non-blocking preload
  const preload = () => {
    preloadFirewallTab();
    preloadLogsTab();
    preloadDHCPTab();
    preloadDnsTab();
    preloadVPNTab();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload, { timeout: 3000 });
  } else {
    setTimeout(preload, 1000);
  }
}

// ===== Light Tab Components (not lazy loaded) =====

// OverviewTab and WiFiTab are loaded eagerly as they are
// the most common entry points and relatively lightweight

export { OverviewTab } from './OverviewTab';
export { WiFiTab } from './WiFiTab';
