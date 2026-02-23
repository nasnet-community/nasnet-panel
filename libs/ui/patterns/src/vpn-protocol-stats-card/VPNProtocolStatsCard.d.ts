/**
 * VPN Protocol Stats Card Component
 * Displays statistics for a single VPN protocol
 * Based on UX Design - Direction 2: Card-Heavy Dashboard
 *
 * @example
 * ```tsx
 * <VPNProtocolStatsCard
 *   stats={{
 *     protocol: 'wireguard',
 *     serverCount: 2,
 *     clientCount: 3,
 *     activeServerConnections: 8,
 *     activeClientConnections: 2,
 *     totalRx: 1024000,
 *     totalTx: 512000,
 *   }}
 *   onClick={() => navigate('/vpn/wireguard')}
 * />
 * ```
 */
import * as React from 'react';
import type { VPNProtocolStats } from '@nasnet/core/types';
export interface VPNProtocolStatsCardProps {
    /** Protocol statistics */
    stats: VPNProtocolStats;
    /** Optional click handler */
    onClick?: () => void;
    /** Show compact version */
    compact?: boolean;
    /** Custom className */
    className?: string;
}
export declare const VPNProtocolStatsCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<VPNProtocolStatsCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=VPNProtocolStatsCard.d.ts.map