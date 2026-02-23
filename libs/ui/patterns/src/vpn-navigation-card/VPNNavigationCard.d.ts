/**
 * VPN Navigation Card Component
 * Card links for navigating to Server/Client pages
 * Based on UX Design - Direction 2: Card-Heavy Dashboard
 *
 * @example
 * ```tsx
 * <VPNNavigationCard
 *   type="server"
 *   count={4}
 *   activeCount={3}
 *   onClick={() => navigate('/vpn/servers')}
 * />
 * ```
 */
import * as React from 'react';
export interface VPNNavigationCardProps {
    /** Card type - server or client */
    type: 'server' | 'client';
    /** Total count */
    count: number;
    /** Active count */
    activeCount: number;
    /** Click handler */
    onClick: () => void;
    /** Custom className */
    className?: string;
}
export declare const VPNNavigationCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<VPNNavigationCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=VPNNavigationCard.d.ts.map