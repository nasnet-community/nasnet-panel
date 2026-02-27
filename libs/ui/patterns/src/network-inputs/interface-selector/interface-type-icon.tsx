/**
 * InterfaceTypeIcon - Icon component for interface types
 *
 * Displays the appropriate icon for each interface type with
 * design token colors following the design system.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { memo } from 'react';

import { Cable, GitMerge, Layers, Wifi, Shield, ArrowRightLeft, RotateCcw } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { InterfaceType, InterfaceTypeIconProps } from './interface-selector.types';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon mapping for each interface type.
 * Uses Lucide icons for consistent visual language.
 */
const INTERFACE_ICONS: Record<InterfaceType, LucideIcon> = {
  ethernet: Cable,
  bridge: GitMerge,
  vlan: Layers,
  wireless: Wifi,
  vpn: Shield,
  tunnel: ArrowRightLeft,
  loopback: RotateCcw,
};

/**
 * Color classes for each interface type.
 * Uses network color coding from visual spec:
 * - WAN (orange): #F97316
 * - LAN (blue): #3B82F6
 * - VPN (green): #22C55E
 * - WiFi (cyan): #06B6D4
 *
 * Maps to semantic design tokens (Tier 2) for proper theming.
 */
const INTERFACE_COLORS: Record<InterfaceType, string> = {
  ethernet: 'text-network-lan', // LAN blue #3B82F6
  bridge: 'text-network-lan', // LAN blue
  vlan: 'text-network-lan', // LAN blue
  wireless: 'text-network-wireless', // WiFi cyan #06B6D4
  vpn: 'text-network-vpn', // VPN green #22C55E
  tunnel: 'text-network-vpn', // VPN green
  loopback: 'text-muted-foreground',
};

/**
 * Interface type icon component.
 *
 * Displays the appropriate icon for the given interface type
 * with proper color coding based on design tokens.
 *
 * @param props - InterfaceTypeIconProps
 */
export const InterfaceTypeIcon = memo(function InterfaceTypeIcon({
  type,
  className,
  size = 5,
}: InterfaceTypeIconProps) {
  const Icon = INTERFACE_ICONS[type];
  const colorClass = INTERFACE_COLORS[type];
  const sizeClass = `h-${size} w-${size}`;

  return (
    <Icon
      className={cn(sizeClass, colorClass, className)}
      aria-hidden="true"
    />
  );
});

InterfaceTypeIcon.displayName = 'InterfaceTypeIcon';

/**
 * Get the display label for an interface type.
 */
export function getInterfaceTypeLabel(type: InterfaceType): string {
  const labels: Record<InterfaceType, string> = {
    ethernet: 'Ethernet',
    bridge: 'Bridge',
    vlan: 'VLAN',
    wireless: 'Wireless',
    vpn: 'VPN',
    tunnel: 'Tunnel',
    loopback: 'Loopback',
  };
  return labels[type];
}

export default InterfaceTypeIcon;
