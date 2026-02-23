/**
 * WireGuard Card Component
 * Displays WireGuard interface with name, status, port, public key, and peer count
 * Expandable to show peer details with Framer Motion animation
 *
 * @see NAS-4.23 - Refactored to use useClipboard hook
 */
import type { WireGuardInterface } from '@nasnet/core/types';
/**
 * WireGuardCard Props
 */
export interface WireGuardCardProps {
    /** WireGuard interface data */
    interface: WireGuardInterface;
    /** Peer count for this interface */
    peerCount?: number;
    /** Optional click handler for card interaction */
    onClick?: () => void;
}
/**
 * WireGuardCard Component
 * Shows WireGuard interface name, listening port, status, public key with copy button, and peer count
 * Expandable to show peer details
 */
declare function WireGuardCardComponent({ interface: wgInterface, peerCount, onClick, }: WireGuardCardProps): import("react/jsx-runtime").JSX.Element;
/**
 * WireGuardCard - Memoized component for performance
 */
export declare const WireGuardCard: import("react").MemoExoticComponent<typeof WireGuardCardComponent>;
export {};
//# sourceMappingURL=WireGuardCard.d.ts.map