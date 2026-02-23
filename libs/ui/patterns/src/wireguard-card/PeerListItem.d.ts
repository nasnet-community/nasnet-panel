/**
 * PeerListItem Component
 * Displays information about a single WireGuard peer
 */
import type { WireGuardPeer } from '@nasnet/core/types';
export interface PeerListItemProps {
    peer: WireGuardPeer;
}
/**
 * Displays a single WireGuard peer with endpoint, allowed IPs, and last handshake
 */
declare function PeerListItemComponent({ peer }: PeerListItemProps): import("react/jsx-runtime").JSX.Element;
/**
 * PeerListItem - Memoized component for performance
 */
export declare const PeerListItem: import("react").MemoExoticComponent<typeof PeerListItemComponent>;
export {};
//# sourceMappingURL=PeerListItem.d.ts.map