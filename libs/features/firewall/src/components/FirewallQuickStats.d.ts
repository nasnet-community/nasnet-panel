/**
 * Firewall Quick Stats Component
 * Compact summary of chain and action distribution
 * Epic 0.6 Enhancement: Dashboard Overview
 */
import React from 'react';
export interface FirewallQuickStatsProps {
    className?: string;
}
/**
 * FirewallQuickStats Component
 *
 * Compact summary of firewall chain and action distribution.
 * Displays rule counts per chain and overall action breakdown.
 *
 * @param props - Component props
 * @returns Quick stats component
 */
declare function FirewallQuickStatsContent({ className }: FirewallQuickStatsProps): import("react/jsx-runtime").JSX.Element;
export declare const FirewallQuickStats: React.MemoExoticComponent<typeof FirewallQuickStatsContent>;
export {};
//# sourceMappingURL=FirewallQuickStats.d.ts.map