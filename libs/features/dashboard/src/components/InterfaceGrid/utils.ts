/**
 * Interface Grid Utilities
 *
 * This module provides utility functions for formatting traffic rates,
 * link speeds, and sorting interfaces by priority.
 */

import { useState, useEffect } from 'react';
import type { InterfaceType } from './types';

/**
 * Format traffic rate from bits per second to human-readable string.
 * @param bitsPerSecond - Traffic rate in bits per second (must be >= 0)
 * @returns Formatted string (e.g., "15.2 Mbps", "0", "1.1 Gbps")
 *
 * @example
 * formatTrafficRate(0) // "0"
 * formatTrafficRate(1500) // "1.5 Kbps"
 * formatTrafficRate(15234567) // "15.2 Mbps"
 * formatTrafficRate(1073741824) // "1.1 Gbps"
 */
export function formatTrafficRate(bitsPerSecond: number): string {
  // Handle zero and negative values
  if (bitsPerSecond <= 0) return '0';

  const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  let unitIndex = 0;
  let rate = bitsPerSecond;

  while (rate >= 1000 && unitIndex < units.length - 1) {
    rate /= 1000;
    unitIndex++;
  }

  // Show 1 decimal for values < 10, otherwise whole number
  const formatted = rate < 10 ? rate.toFixed(1) : Math.round(rate).toString();
  return `${formatted} ${units[unitIndex]}`;
}

/**
 * Format link speed for compact display.
 * @param speed - Raw link speed (e.g., "1Gbps", "100Mbps", undefined)
 * @returns Compact format (e.g., "1G", "100M") or empty string if undefined
 *
 * @example
 * formatLinkSpeed("1Gbps") // "1G"
 * formatLinkSpeed("100Mbps") // "100M"
 * formatLinkSpeed(undefined) // ""
 */
export function formatLinkSpeed(speed: string | undefined): string {
  if (!speed) return '';
  return speed
    .replace('Gbps', 'G')
    .replace('Mbps', 'M')
    .replace('Kbps', 'K');
}

/**
 * Priority order for interface types (lower = higher priority).
 * Ethernet first, then Bridge, Wireless, VPN, etc.
 */
export const INTERFACE_TYPE_PRIORITY: Record<InterfaceType, number> = {
  ethernet: 1,
  bridge: 2,
  wireless: 3,
  vpn: 4,
  tunnel: 5,
  vlan: 6,
  loopback: 7,
};

/**
 * Sort interfaces by type priority, then by name alphabetically.
 * @param interfaces - Array of interfaces to sort
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * const interfaces = [
 *   { type: 'vpn', name: 'wg1' },
 *   { type: 'ethernet', name: 'ether2' },
 *   { type: 'ethernet', name: 'ether1' },
 * ];
 * sortInterfacesByPriority(interfaces);
 * // [
 * //   { type: 'ethernet', name: 'ether1' },
 * //   { type: 'ethernet', name: 'ether2' },
 * //   { type: 'vpn', name: 'wg1' },
 * // ]
 */
export function sortInterfacesByPriority<
  T extends { type: InterfaceType; name: string },
>(interfaces: T[]): T[] {
  return [...interfaces].sort((a, b) => {
    const priorityDiff =
      INTERFACE_TYPE_PRIORITY[a.type] - INTERFACE_TYPE_PRIORITY[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Hook to detect user's reduced motion preference.
 * Respects the prefers-reduced-motion media query for accessibility.
 *
 * @returns true if user prefers reduced motion
 *
 * @example
 * function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *   return (
 *     <div className={cn(!prefersReducedMotion && 'animate-pulse')}>
 *       Content
 *     </div>
 *   );
 * }
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
