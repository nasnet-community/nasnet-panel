/**
 * Traffic Flow Diagram Component
 *
 * Visual representation of packet flow through firewall chains with rule counts,
 * animated traffic indicators, and interactive chain filtering.
 *
 * @description Displays the complete firewall packet flow through all chains
 * (PREROUTING, ROUTING, FORWARD, POSTROUTING, INPUT, LOCAL, OUTPUT) with rule
 * counts and highlights for active/selected chains. Click nodes to filter rules
 * by chain. Responsive SVG adapts layout for all screen sizes.
 *
 * @example
 * ```tsx
 * <TrafficFlowDiagram
 *   activeChain="forward"
 *   onChainClick={(chain) => filterRulesByChain(chain)}
 * />
 * ```
 */
import React from 'react';
import type { FirewallChain } from '@nasnet/core/types';
import './TrafficFlowDiagram.css';
export interface TrafficFlowDiagramProps {
    /** Optional CSS class name for custom styling */
    className?: string;
    /** Currently highlighted chain for visual emphasis */
    activeChain?: FirewallChain | null;
    /** Callback when user clicks a chain node */
    onChainClick?: (chain: FirewallChain) => void;
}
/**
 * TrafficFlowDiagram Component
 *
 * Visual representation of packet flow through all firewall chains with rule counts
 * and interactive filtering. Displays the packet path from input through routing
 * decisions to output, with animated traffic indicators.
 */
export declare const TrafficFlowDiagram: React.NamedExoticComponent<TrafficFlowDiagramProps>;
//# sourceMappingURL=TrafficFlowDiagram.d.ts.map