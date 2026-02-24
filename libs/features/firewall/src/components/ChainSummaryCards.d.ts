/**
 * Chain Summary Cards Component
 * Displays aggregated statistics per firewall chain
 * Epic 0.6 Enhancement: Chain Summary Overview
 */
import React from 'react';
import type { FirewallChain } from '@nasnet/core/types';
export interface ChainSummaryCardsProps {
    className?: string;
    selectedChain?: FirewallChain | null;
    onChainSelect?: (chain: FirewallChain | null) => void;
}
/**
 * ChainSummaryCards Component
 *
 * Displays summary statistics per firewall chain with visual indicators.
 * Features color-coded cards (input=blue, forward=purple, output=amber),
 * accept/drop/disabled counts, and visual action distribution bars.
 *
 * @param props - Component props
 * @returns Chain summary cards component
 */
declare const ChainSummaryCards: React.NamedExoticComponent<ChainSummaryCardsProps>;
export { ChainSummaryCards };
//# sourceMappingURL=ChainSummaryCards.d.ts.map