/**
 * Protocol Icon Component
 * Renders SVG icons for different VPN protocols
 * Based on NasNetConnect Design System
 */

import * as React from 'react';
import { 
  Shield, 
  Lock, 
  Network, 
  KeyRound, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
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
        colorClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        label: 'WireGuard',
      };
    case 'openvpn':
      return {
        Icon: Globe,
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
        label: 'OpenVPN',
      };
    case 'l2tp':
      return {
        Icon: Network,
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
        label: 'L2TP',
      };
    case 'pptp':
      return {
        Icon: Lock,
        colorClass: 'text-purple-500',
        bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
        label: 'PPTP',
      };
    case 'sstp':
      return {
        Icon: ShieldCheck,
        colorClass: 'text-cyan-500',
        bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        label: 'SSTP',
      };
    case 'ikev2':
      return {
        Icon: KeyRound,
        colorClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
        label: 'IKEv2',
      };
    default:
      return {
        Icon: Shield,
        colorClass: 'text-slate-500',
        bgClass: 'bg-slate-500/10 dark:bg-slate-500/20',
        label: 'VPN',
      };
  }
}

/**
 * ProtocolIcon Component
 * Renders the appropriate icon for a VPN protocol
 */
export function ProtocolIcon({ 
  protocol, 
  size = 20, 
  className = '' 
}: ProtocolIconProps) {
  const config = getProtocolConfig(protocol);
  const Icon = config.Icon;

  return (
    <Icon 
      className={`${config.colorClass} ${className}`} 
      size={size}
      aria-label={config.label}
    />
  );
}

/**
 * ProtocolIconBadge Component
 * Icon with colored background badge
 */
export interface ProtocolIconBadgeProps extends ProtocolIconProps {
  /** Size variant */
  variant?: 'sm' | 'md' | 'lg';
}

export function ProtocolIconBadge({ 
  protocol, 
  variant = 'md',
  className = '' 
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
      className={`
        ${sizes.container} 
        ${config.bgClass} 
        rounded-xl flex items-center justify-center
        ${className}
      `}
    >
      <Icon 
        className={config.colorClass} 
        size={sizes.icon}
        aria-label={config.label}
      />
    </div>
  );
}

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

