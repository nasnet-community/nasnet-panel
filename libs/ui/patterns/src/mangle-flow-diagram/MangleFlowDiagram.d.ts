/**
 * MangleFlowDiagram - Visual Packet Flow Diagram
 *
 * Interactive diagram showing packet flow through mangle chains:
 * PACKET IN → prerouting → [Routing] → input/forward → output → postrouting → PACKET OUT
 *
 * Features:
 * - Rule count badges at each chain
 * - Interactive chain selection (click to filter)
 * - "Trace Packet" mode for debugging
 * - Responsive layout (horizontal desktop, vertical mobile)
 *
 * @module @nasnet/ui/patterns/mangle-flow-diagram
 * @see NAS-7.5: Implement Mangle Rules
 */
import type { MangleChain } from '@nasnet/core/types';
export interface MangleFlowDiagramProps {
    /** Rule counts per chain */
    ruleCounts?: Record<MangleChain, number>;
    /** Selected chain for filtering */
    selectedChain?: MangleChain | null;
    /** Callback when chain is selected */
    onChainSelect?: (chain: MangleChain | null) => void;
    /** Trace mode - highlight matching chains */
    traceMode?: boolean;
    /** Highlighted chains in trace mode */
    highlightedChains?: MangleChain[];
    /** Compact mode (smaller, no labels) */
    compact?: boolean;
}
/**
 * MangleFlowDiagram - Visual packet flow through mangle chains
 *
 * @example
 * ```tsx
 * <MangleFlowDiagram
 *   ruleCounts={{
 *     prerouting: 5,
 *     input: 2,
 *     forward: 10,
 *     output: 3,
 *     postrouting: 4,
 *   }}
 *   selectedChain="forward"
 *   onChainSelect={(chain) => setSelectedChain(chain)}
 * />
 * ```
 */
export declare const MangleFlowDiagram: import("react").NamedExoticComponent<MangleFlowDiagramProps>;
export default MangleFlowDiagram;
//# sourceMappingURL=MangleFlowDiagram.d.ts.map