/**
 * VPN Card Enhanced Component
 *
 * Quick VPN toggle with status display for dashboard.
 * Based on UX Design Specification - Direction 1: Clean Minimal.
 *
 * @example
 * ```tsx
 * <VPNCardEnhanced
 *   status="connected"
 *   profile={{ name: 'Office VPN', location: 'Frankfurt' }}
 *   onToggle={(enabled) => handleToggle(enabled)}
 * />
 * ```
 */
/**
 * VPN connection status
 */
export type VPNStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
/**
 * VPN profile information
 */
export interface VPNProfile {
    /** Profile/connection name */
    name: string;
    /** Server location */
    location?: string;
    /** Optional country flag emoji */
    flag?: string;
}
/**
 * VPNCardEnhanced Props
 */
export interface VPNCardEnhancedProps {
    /** Current VPN connection status */
    status: VPNStatus;
    /** VPN profile information */
    profile?: VPNProfile;
    /** Toggle handler */
    onToggle: (enabled: boolean) => void;
    /** Custom className */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
}
/**
 * VPNCardEnhanced Component
 * Displays VPN status with toggle switch
 * Shows connection status, profile info, and allows quick connect/disconnect
 */
declare function VPNCardEnhancedComponent({ status, profile, onToggle, className, disabled, }: VPNCardEnhancedProps): import("react/jsx-runtime").JSX.Element;
export declare const VPNCardEnhanced: import("react").MemoExoticComponent<typeof VPNCardEnhancedComponent>;
export {};
//# sourceMappingURL=VPNCardEnhanced.d.ts.map