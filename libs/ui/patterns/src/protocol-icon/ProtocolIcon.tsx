/**
 * Protocol Icon Component
 * Renders SVG icons for different VPN protocols
 * Based on NasNetConnect Design System
 */

import * as React from 'react';

import { memo } from 'react';

import {
  Shield,
  Lock,
  Network,
  KeyRound,
  Globe,
  ShieldCheck
} from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { VPNProtocol } from '@nasnet/core/types';

export interface ProtocolIconProps {
  /** VPN protocol type */
  protocol: VPNProtocol;
  /** Icon size in pixels */
  size?: number;
  /** Additional className */
  className?: string;
}

/**
 * Get icon and color configuration for protocol
 */
function getProtocolConfig(protocol: VPNProtocol) {
  switch (protocol) {
    case 'wireguard':
      return {
        Icon: Shield,
        colorClass: 'text-success',
        bgClass: 'bg-success/10',
        label: 'WireGuard',
      };
    case 'openvpn':
      return {
        Icon: Globe,
        colorClass: 'text-warning',
        bgClass: 'bg-warning/10',
        label: 'OpenVPN',
      };
    case 'l2tp':
      return {
        Icon: Network,
        colorClass: 'text-info',
        bgClass: 'bg-info/10',
        label: 'L2TP',
      };
    case 'pptp':
      return {
        Icon: Lock,
        colorClass: 'text-error',
        bgClass: 'bg-error/10',
        label: 'PPTP',
      };
    case 'sstp':
      return {
        Icon: ShieldCheck,
        colorClass: 'text-primary',
        bgClass: 'bg-primary/10',
        label: 'SSTP',
      };
    case 'ikev2':
      return {
        Icon: KeyRound,
        colorClass: 'text-secondary',
        bgClass: 'bg-secondary/10',
        label: 'IKEv2',
      };
    default:
      return {
        Icon: Shield,
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-muted',
        label: 'VPN',
      };
  }
}

/**
 * ProtocolIcon Component
 * Renders the appropriate icon for a VPN protocol
 */
function ProtocolIconComponent({
  protocol,
  size = 20,
  className
}: ProtocolIconProps) {
  const config = getProtocolConfig(protocol);
  const Icon = config.Icon;

  return (
    <Icon
      className={cn(config.colorClass, className)}
      size={size}
      aria-label={config.label}
    />
  );
}

ProtocolIconComponent.displayName = 'ProtocolIcon';

export const ProtocolIcon = memo(ProtocolIconComponent);

/**
 * ProtocolIconBadge Component
 * Icon with colored background badge
 */
export interface ProtocolIconBadgeProps extends ProtocolIconProps {
  /** Size variant */
  variant?: 'sm' | 'md' | 'lg';
}

function ProtocolIconBadgeComponent({
  protocol,
  variant = 'md',
  className
}: ProtocolIconBadgeProps) {
  const config = getProtocolConfig(protocol);
  const Icon = config.Icon;

  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 16 },
    md: { container: 'w-10 h-10', icon: 20 },
    lg: { container: 'w-12 h-12', icon: 24 },
  };

  const sizes = sizeMap[variant];

  return (
    <div
      className={cn(
        sizes.container,
        config.bgClass,
        'rounded-xl flex items-center justify-center',
        className
      )}
    >
      <Icon
        className={config.colorClass}
        size={sizes.icon}
        aria-label={config.label}
      />
    </div>
  );
}

ProtocolIconBadgeComponent.displayName = 'ProtocolIconBadge';

export const ProtocolIconBadge = memo(ProtocolIconBadgeComponent);

/**
 * Get protocol label
 */
export function getProtocolLabel(protocol: VPNProtocol): string {
  return getProtocolConfig(protocol).label;
}

/**
 * Get protocol color class
 */
export function getProtocolColorClass(protocol: VPNProtocol): string {
  return getProtocolConfig(protocol).colorClass;
}

/**
 * Get protocol background class
 */
export function getProtocolBgClass(protocol: VPNProtocol): string {
  return getProtocolConfig(protocol).bgClass;
}
