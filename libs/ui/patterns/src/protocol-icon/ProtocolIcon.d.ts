/**
 * Protocol Icon Component
 * Renders SVG icons for different VPN protocols
 * Based on NasNetConnect Design System
 */
import * as React from 'react';
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
 * ProtocolIcon Component
 * Renders the appropriate icon for a VPN protocol
 */
declare function ProtocolIconComponent({ protocol, size, className }: ProtocolIconProps): import("react/jsx-runtime").JSX.Element;
declare namespace ProtocolIconComponent {
    var displayName: string;
}
export declare const ProtocolIcon: React.MemoExoticComponent<typeof ProtocolIconComponent>;
/**
 * ProtocolIconBadge Component
 * Icon with colored background badge
 */
export interface ProtocolIconBadgeProps extends ProtocolIconProps {
    /** Size variant */
    variant?: 'sm' | 'md' | 'lg';
}
declare function ProtocolIconBadgeComponent({ protocol, variant, className }: ProtocolIconBadgeProps): import("react/jsx-runtime").JSX.Element;
declare namespace ProtocolIconBadgeComponent {
    var displayName: string;
}
export declare const ProtocolIconBadge: React.MemoExoticComponent<typeof ProtocolIconBadgeComponent>;
/**
 * Get protocol label
 */
export declare function getProtocolLabel(protocol: VPNProtocol): string;
/**
 * Get protocol color class
 */
export declare function getProtocolColorClass(protocol: VPNProtocol): string;
/**
 * Get protocol background class
 */
export declare function getProtocolBgClass(protocol: VPNProtocol): string;
export {};
//# sourceMappingURL=ProtocolIcon.d.ts.map