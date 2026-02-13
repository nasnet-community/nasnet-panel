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

import { memo, useMemo } from 'react';
import { ArrowRight, ArrowDown, Filter, Package, Router } from 'lucide-react';

import { Card, Badge, Button } from '@nasnet/ui/primitives';
import { usePlatform } from '@nasnet/ui/layouts';

import type { MangleChain } from '@nasnet/core/types/firewall';

// ============================================================================
// Types
// ============================================================================

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

interface ChainNodeProps {
  chain: MangleChain;
  label: string;
  description: string;
  count?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Chain Node Component
// ============================================================================

const ChainNode = memo(function ChainNode({
  chain,
  label,
  description,
  count = 0,
  isSelected = false,
  isHighlighted = false,
  onClick,
}: ChainNodeProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        min-w-[120px] h-20 px-4 py-2
        rounded-lg border-2 transition-all
        ${isSelected ? 'border-primary bg-primary/10 shadow-md' : 'border-muted bg-background'}
        ${isHighlighted ? 'ring-2 ring-warning ring-offset-2' : ''}
        hover:border-primary/50 hover:shadow-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
      `}
      aria-label={`${label} chain - ${count} rules`}
      aria-pressed={isSelected}
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground text-center">{description}</span>

      {count > 0 && (
        <Badge
          variant={isSelected ? 'default' : 'secondary'}
          className="absolute -top-2 -right-2 h-6 min-w-6 flex items-center justify-center"
        >
          {count}
        </Badge>
      )}
    </button>
  );
});

// ============================================================================
// Routing Decision Node
// ============================================================================

const RoutingDecisionNode = memo(function RoutingDecisionNode() {
  return (
    <div className="flex flex-col items-center justify-center min-w-[120px] h-20 px-4 py-2 rounded-lg border-2 border-dashed border-info bg-info/5">
      <Router className="h-5 w-5 text-info mb-1" />
      <span className="text-sm font-semibold text-info">Routing</span>
      <span className="text-xs text-info/70">Decision</span>
    </div>
  );
});

// ============================================================================
// Arrow Components
// ============================================================================

const HorizontalArrow = memo(function HorizontalArrow() {
  return (
    <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" aria-hidden="true" />
  );
});

const VerticalArrow = memo(function VerticalArrow() {
  return (
    <ArrowDown className="h-6 w-6 text-muted-foreground flex-shrink-0" aria-hidden="true" />
  );
});

// ============================================================================
// Main Component
// ============================================================================

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
export const MangleFlowDiagram = memo(function MangleFlowDiagram({
  ruleCounts = {
    prerouting: 0,
    input: 0,
    forward: 0,
    output: 0,
    postrouting: 0,
  },
  selectedChain = null,
  onChainSelect,
  traceMode = false,
  highlightedChains = [],
  compact = false,
}: MangleFlowDiagramProps) {
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  // Handle chain click
  const handleChainClick = (chain: MangleChain) => {
    if (onChainSelect) {
      // Toggle selection - click again to deselect
      onChainSelect(selectedChain === chain ? null : chain);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    onChainSelect?.(null);
  };

  // Desktop: Horizontal Flow
  if (!isMobile) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Packet Flow</h3>
            </div>

            {selectedChain && (
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filter
              </Button>
            )}
          </div>

          {/* Flow Diagram - Desktop (Horizontal) */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
            {/* PACKET IN */}
            <div className="flex flex-col items-center gap-1">
              <Package className="h-6 w-6 text-success" aria-label="Packet In" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">PACKET IN</span>
            </div>

            <HorizontalArrow />

            {/* Prerouting */}
            <ChainNode
              chain="prerouting"
              label="prerouting"
              description="Before routing"
              count={ruleCounts.prerouting}
              isSelected={selectedChain === 'prerouting'}
              isHighlighted={traceMode && highlightedChains.includes('prerouting')}
              onClick={() => handleChainClick('prerouting')}
            />

            <HorizontalArrow />

            {/* Routing Decision */}
            <RoutingDecisionNode />

            <HorizontalArrow />

            {/* Input/Forward Split */}
            <div className="flex flex-col gap-2">
              <ChainNode
                chain="input"
                label="input"
                description="To router"
                count={ruleCounts.input}
                isSelected={selectedChain === 'input'}
                isHighlighted={traceMode && highlightedChains.includes('input')}
                onClick={() => handleChainClick('input')}
              />
              <ChainNode
                chain="forward"
                label="forward"
                description="Through router"
                count={ruleCounts.forward}
                isSelected={selectedChain === 'forward'}
                isHighlighted={traceMode && highlightedChains.includes('forward')}
                onClick={() => handleChainClick('forward')}
              />
            </div>

            <HorizontalArrow />

            {/* Output */}
            <ChainNode
              chain="output"
              label="output"
              description="From router"
              count={ruleCounts.output}
              isSelected={selectedChain === 'output'}
              isHighlighted={traceMode && highlightedChains.includes('output')}
              onClick={() => handleChainClick('output')}
            />

            <HorizontalArrow />

            {/* Postrouting */}
            <ChainNode
              chain="postrouting"
              label="postrouting"
              description="After routing"
              count={ruleCounts.postrouting}
              isSelected={selectedChain === 'postrouting'}
              isHighlighted={traceMode && highlightedChains.includes('postrouting')}
              onClick={() => handleChainClick('postrouting')}
            />

            <HorizontalArrow />

            {/* PACKET OUT */}
            <div className="flex flex-col items-center gap-1">
              <Package className="h-6 w-6 text-destructive" aria-label="Packet Out" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">PACKET OUT</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span>Incoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-info" />
              <span>Routing Decision</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span>Outgoing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-5 min-w-5">
                N
              </Badge>
              <span>Rule Count</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Mobile: Vertical Flow
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Packet Flow</h3>
          </div>

          {selectedChain && (
            <Button variant="outline" size="sm" onClick={handleClearSelection}>
              Clear
            </Button>
          )}
        </div>

        {/* Flow Diagram - Mobile (Vertical) */}
        <div className="flex flex-col items-center gap-3">
          {/* PACKET IN */}
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-success" />
            <span className="text-sm font-semibold text-success">PACKET IN</span>
          </div>

          <VerticalArrow />

          {/* Prerouting */}
          <ChainNode
            chain="prerouting"
            label="prerouting"
            description="Before routing"
            count={ruleCounts.prerouting}
            isSelected={selectedChain === 'prerouting'}
            isHighlighted={traceMode && highlightedChains.includes('prerouting')}
            onClick={() => handleChainClick('prerouting')}
          />

          <VerticalArrow />

          {/* Routing Decision */}
          <RoutingDecisionNode />

          <VerticalArrow />

          {/* Input/Forward */}
          <div className="flex flex-col gap-3 w-full items-center">
            <ChainNode
              chain="input"
              label="input"
              description="To router"
              count={ruleCounts.input}
              isSelected={selectedChain === 'input'}
              isHighlighted={traceMode && highlightedChains.includes('input')}
              onClick={() => handleChainClick('input')}
            />

            <ChainNode
              chain="forward"
              label="forward"
              description="Through router"
              count={ruleCounts.forward}
              isSelected={selectedChain === 'forward'}
              isHighlighted={traceMode && highlightedChains.includes('forward')}
              onClick={() => handleChainClick('forward')}
            />
          </div>

          <VerticalArrow />

          {/* Output */}
          <ChainNode
            chain="output"
            label="output"
            description="From router"
            count={ruleCounts.output}
            isSelected={selectedChain === 'output'}
            isHighlighted={traceMode && highlightedChains.includes('output')}
            onClick={() => handleChainClick('output')}
          />

          <VerticalArrow />

          {/* Postrouting */}
          <ChainNode
            chain="postrouting"
            label="postrouting"
            description="After routing"
            count={ruleCounts.postrouting}
            isSelected={selectedChain === 'postrouting'}
            isHighlighted={traceMode && highlightedChains.includes('postrouting')}
            onClick={() => handleChainClick('postrouting')}
          />

          <VerticalArrow />

          {/* PACKET OUT */}
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-destructive" />
            <span className="text-sm font-semibold text-destructive">PACKET OUT</span>
          </div>
        </div>
      </div>
    </Card>
  );
});

MangleFlowDiagram.displayName = 'MangleFlowDiagram';

export default MangleFlowDiagram;
