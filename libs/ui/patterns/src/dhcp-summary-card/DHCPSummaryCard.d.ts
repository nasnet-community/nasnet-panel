/**
 * DHCP Summary Card Component
 * Compact card showing active leases count and IP range
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * Features:
 * - Active lease count display with capacity ratio
 * - IP address range visualization
 * - Loading state with spinner
 * - Optional link navigation with hover effects
 * - Dark/light theme support
 *
 * @example
 * ```tsx
 * <DHCPSummaryCard
 *   activeLeases={24}
 *   totalCapacity={100}
 *   ipRange="192.168.1.100-192.168.1.200"
 * />
 * ```
 */
import * as React from 'react';
/**
 * DHCPSummaryCard Props
 */
export interface DHCPSummaryCardProps {
    /** Total number of active leases */
    activeLeases: number;
    /** Total number of leases (for capacity) */
    totalCapacity?: number;
    /** IP address range (e.g., "192.168.1.100-192.168.1.200") */
    ipRange?: string;
    /** Server name */
    serverName?: string;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Link to full DHCP page */
    linkTo?: string;
    /** Custom className */
    className?: string;
}
/**
 * DHCPSummaryCard Component
 * Shows DHCP server summary with active lease count and IP range
 */
declare function DHCPSummaryCardComponent({ activeLeases, totalCapacity, ipRange, serverName, isLoading, linkTo, className, }: DHCPSummaryCardProps): import("react/jsx-runtime").JSX.Element;
declare namespace DHCPSummaryCardComponent {
    var displayName: string;
}
export declare const DHCPSummaryCard: React.MemoExoticComponent<typeof DHCPSummaryCardComponent>;
export {};
//# sourceMappingURL=DHCPSummaryCard.d.ts.map