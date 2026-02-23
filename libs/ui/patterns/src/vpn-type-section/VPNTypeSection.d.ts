/**
 * VPNTypeSection Component
 * Collapsible section for grouping VPN interfaces by type
 * Story 0-4-4: Other VPN Type Viewer
 *
 * @example
 * ```tsx
 * <VPNTypeSection type="L2TP" count={2} defaultExpanded={false}>
 *   <GenericVPNCard {...l2tpInterface1} />
 *   <GenericVPNCard {...l2tpInterface2} />
 * </VPNTypeSection>
 * ```
 */
import React from 'react';
export interface VPNTypeSectionProps {
    /** VPN type label (e.g., "L2TP", "PPTP", "SSTP") */
    type: string;
    /** Number of interfaces of this type */
    count: number;
    /** Whether section is expanded by default */
    defaultExpanded?: boolean;
    /** Section children (VPN cards) */
    children: React.ReactNode;
    /** Optional icon component for the VPN type */
    icon?: React.ReactNode;
    /** Whether to show read-only notice */
    showReadOnlyNotice?: boolean;
    /** Custom className */
    className?: string;
}
export declare const VPNTypeSection: React.MemoExoticComponent<React.ForwardRefExoticComponent<VPNTypeSectionProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=VPNTypeSection.d.ts.map