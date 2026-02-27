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

import React, { useMemo, useCallback } from 'react';
import { useFilterRules, useNATRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallChain } from '@nasnet/core/types';
import './TrafficFlowDiagram.css';

// ============================================================================
// CHAIN NODE COMPONENT
// ============================================================================

interface ChainNodeProps {
  label: string;
  count: number;
  isActive: boolean;
  isHighlighted: boolean;
  onClick?: () => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Chain node component - Interactive clickable firewall chain node
 */
const ChainNode = React.memo(function ChainNode({
  label,
  count,
  isActive,
  isHighlighted,
  onClick,
  x,
  y,
  width = 100,
  height = 40,
}: ChainNodeProps) {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const BORDER_RADIUS = 8;

  return (
    <g
      className={`chain-node ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      transform={`translate(${x}, ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`${label} chain with ${count} rules`}
    >
      {/* Background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={BORDER_RADIUS}
        className={`transition-all duration-200 ${
          isHighlighted ? 'fill-primary stroke-primary stroke-2'
          : isActive ? 'fill-muted stroke-border'
          : 'fill-background stroke-border'
        } `}
      />

      {/* Label */}
      <text
        className={`text-xs font-medium ${
          isHighlighted ? 'fill-primary-foreground' : 'fill-foreground'
        }`}
        textAnchor="middle"
        dy="-0.2em"
      >
        {label}
      </text>

      {/* Count badge */}
      {count > 0 && (
        <text
          className="fill-muted-foreground text-[10px]"
          textAnchor="middle"
          dy="1.2em"
        >
          {count} rules
        </text>
      )}
    </g>
  );
});
ChainNode.displayName = 'ChainNode';

// ============================================================================
// ARROW PATH COMPONENT
// ============================================================================

interface ArrowPathProps {
  d: string;
  isAnimated: boolean;
  isHighlighted: boolean;
}

/**
 * Arrow path component - Animated dashed line showing traffic flow direction
 */
const ArrowPath = React.memo(function ArrowPath({ d, isAnimated, isHighlighted }: ArrowPathProps) {
  return (
    <>
      {/* Base path */}
      <path
        d={d}
        fill="none"
        className={`transition-all duration-200 ${
          isHighlighted ? 'stroke-primary stroke-2' : 'stroke-border'
        } `}
        markerEnd="url(#arrowhead)"
      />
      {/* Animated overlay */}
      {isAnimated && (
        <path
          d={d}
          fill="none"
          className="traffic-flow-path stroke-primary"
          strokeDasharray="8,4"
        />
      )}
    </>
  );
});
ArrowPath.displayName = 'ArrowPath';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
export const TrafficFlowDiagram = React.memo(function TrafficFlowDiagram({
  className,
  activeChain,
  onChainClick,
}: TrafficFlowDiagramProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: filterRules } = useFilterRules(routerIp);
  const { data: natRules } = useNATRules(routerIp);

  const handleChainClick = useCallback(
    (chain: FirewallChain) => {
      onChainClick?.(chain);
    },
    [onChainClick]
  );

  // Calculate rule counts per chain
  const chainCounts = useMemo(() => {
    const counts: Record<string, number> = {
      prerouting: 0,
      input: 0,
      forward: 0,
      output: 0,
      postrouting: 0,
    };

    // Count filter rules
    filterRules?.forEach((rule) => {
      if (counts[rule.chain] !== undefined) {
        counts[rule.chain]++;
      }
    });

    // Count NAT rules (prerouting/postrouting)
    natRules?.forEach((rule) => {
      if (rule.action === 'src-nat' || rule.action === 'masquerade') {
        counts.postrouting++;
      } else if (rule.action === 'dst-nat' || rule.action === 'redirect') {
        counts.prerouting++;
      }
    });

    return counts;
  }, [filterRules, natRules]);

  // SVG dimensions and node positions (constants)
  const SVG_WIDTH = 700;
  const SVG_HEIGHT = 200;

  const NODE_POSITIONS = useMemo(
    () => ({
      prerouting: { x: 80, y: 50 },
      routing: { x: 220, y: 50 },
      forward: { x: 420, y: 50 },
      postrouting: { x: 580, y: 50 },
      input: { x: 220, y: 150 },
      local: { x: 350, y: 150 },
      output: { x: 480, y: 150 },
    }),
    []
  );

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-component-sm mb-component-md">
        <h2 className="font-display text-lg font-semibold">Traffic Flow</h2>
        <p className="text-muted-foreground text-sm">Packet path through firewall chains</p>
      </div>

      {/* Diagram container */}
      <div className="bg-card border-border p-component-md overflow-x-auto rounded-[var(--semantic-radius-card)] border">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-auto w-full min-w-[600px]"
          style={{ maxHeight: '250px' }}
          aria-label="Firewall chain packet flow diagram"
        >
          {/* Definitions */}
          <defs>
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-border"
              />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-primary"
              />
            </marker>
          </defs>

          {/* Connection paths */}
          <g className="paths">
            {/* IN -> Prerouting */}
            <ArrowPath
              d={`M 10,50 L ${NODE_POSITIONS.prerouting.x - 55},50`}
              isAnimated
              isHighlighted={activeChain === 'prerouting'}
            />

            {/* Prerouting -> Routing */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.prerouting.x + 55},50 L ${NODE_POSITIONS.routing.x - 50},50`}
              isAnimated
              isHighlighted={activeChain === 'prerouting'}
            />

            {/* Routing -> Forward */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.routing.x + 50},50 L ${NODE_POSITIONS.forward.x - 55},50`}
              isAnimated
              isHighlighted={activeChain === 'forward'}
            />

            {/* Forward -> Postrouting */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.forward.x + 55},50 L ${NODE_POSITIONS.postrouting.x - 60},50`}
              isAnimated
              isHighlighted={activeChain === 'forward' || activeChain === 'postrouting'}
            />

            {/* Postrouting -> OUT */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.postrouting.x + 60},50 L ${SVG_WIDTH - 10},50`}
              isAnimated
              isHighlighted={activeChain === 'postrouting'}
            />

            {/* Routing -> Input (down) */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.routing.x},70 L ${NODE_POSITIONS.routing.x},${NODE_POSITIONS.input.y - 20}`}
              isAnimated
              isHighlighted={activeChain === 'input'}
            />

            {/* Input -> Local */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.input.x + 55},150 L ${NODE_POSITIONS.local.x - 55},150`}
              isAnimated
              isHighlighted={activeChain === 'input'}
            />

            {/* Local -> Output */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.local.x + 55},150 L ${NODE_POSITIONS.output.x - 55},150`}
              isAnimated
              isHighlighted={activeChain === 'output'}
            />

            {/* Output -> Postrouting (up) */}
            <ArrowPath
              d={`M ${NODE_POSITIONS.output.x + 20},130 Q ${NODE_POSITIONS.output.x + 60},100 ${NODE_POSITIONS.postrouting.x - 30},70`}
              isAnimated
              isHighlighted={activeChain === 'output' || activeChain === 'postrouting'}
            />
          </g>

          {/* Labels */}
          <g className="labels">
            <text
              x={10}
              y={35}
              className="fill-muted-foreground text-xs"
            >
              IN
            </text>
            <text
              x={SVG_WIDTH - 30}
              y={35}
              className="fill-muted-foreground text-xs"
            >
              OUT
            </text>
          </g>

          {/* Chain nodes */}
          <g className="nodes">
            <ChainNode
              label="PREROUTING"
              count={chainCounts.prerouting}
              isActive={chainCounts.prerouting > 0}
              isHighlighted={activeChain === 'prerouting'}
              onClick={() => handleChainClick('prerouting')}
              x={NODE_POSITIONS.prerouting.x}
              y={NODE_POSITIONS.prerouting.y}
              width={100}
              height={40}
            />

            {/* Routing Decision (not clickable) */}
            <g transform={`translate(${NODE_POSITIONS.routing.x}, ${NODE_POSITIONS.routing.y})`}>
              <rect
                x={-45}
                y={-20}
                width={90}
                height={40}
                rx={4}
                className="fill-muted stroke-border"
                style={{ transform: 'rotate(45deg) scale(0.7)' }}
              />
              <text
                className="fill-foreground text-[9px] font-medium"
                textAnchor="middle"
                dy="0.3em"
              >
                ROUTING
              </text>
            </g>

            <ChainNode
              label="FORWARD"
              count={chainCounts.forward}
              isActive={chainCounts.forward > 0}
              isHighlighted={activeChain === 'forward'}
              onClick={() => handleChainClick('forward')}
              x={NODE_POSITIONS.forward.x}
              y={NODE_POSITIONS.forward.y}
              width={100}
              height={40}
            />

            <ChainNode
              label="POSTROUTING"
              count={chainCounts.postrouting}
              isActive={chainCounts.postrouting > 0}
              isHighlighted={activeChain === 'postrouting'}
              onClick={() => handleChainClick('postrouting')}
              x={NODE_POSITIONS.postrouting.x}
              y={NODE_POSITIONS.postrouting.y}
              width={110}
              height={40}
            />

            <ChainNode
              label="INPUT"
              count={chainCounts.input}
              isActive={chainCounts.input > 0}
              isHighlighted={activeChain === 'input'}
              onClick={() => handleChainClick('input')}
              x={NODE_POSITIONS.input.x}
              y={NODE_POSITIONS.input.y}
              width={100}
              height={40}
            />

            {/* Local Process (not clickable) */}
            <g transform={`translate(${NODE_POSITIONS.local.x}, ${NODE_POSITIONS.local.y})`}>
              <rect
                x={-50}
                y={-20}
                width={100}
                height={40}
                rx={20}
                className="fill-secondary stroke-secondary-foreground/50"
              />
              <text
                className="fill-secondary-foreground text-[10px] font-medium"
                textAnchor="middle"
                dy="0.3em"
              >
                Local Process
              </text>
            </g>

            <ChainNode
              label="OUTPUT"
              count={chainCounts.output}
              isActive={chainCounts.output > 0}
              isHighlighted={activeChain === 'output'}
              onClick={() => handleChainClick('output')}
              x={NODE_POSITIONS.output.x}
              y={NODE_POSITIONS.output.y}
              width={100}
              height={40}
            />
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-component-sm px-component-sm gap-component-md text-muted-foreground flex flex-wrap items-center text-xs">
        <span className="gap-component-sm flex items-center">
          <span className="bg-border inline-block h-0.5 w-4" />
          Packet flow
        </span>
        <span className="gap-component-sm flex items-center">
          <span className="border-primary inline-block h-0.5 w-6 border-t-2 border-dashed" />
          Active traffic
        </span>
        <span className="gap-component-sm flex items-center">
          <span className="bg-muted border-border inline-block h-3 w-3 rounded-[var(--semantic-radius-badge)] border" />
          Chain (click to filter)
        </span>
      </div>
    </div>
  );
});
TrafficFlowDiagram.displayName = 'TrafficFlowDiagram';
