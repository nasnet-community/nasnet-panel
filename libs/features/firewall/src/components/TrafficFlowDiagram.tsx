/**
 * Traffic Flow Diagram Component
 * Visual representation of packet flow through firewall chains
 * Epic 0.6 Enhancement: Traffic Flow Visualization
 */

import { useMemo } from 'react';
import { useFilterRules, useNATRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallChain } from '@nasnet/core/types';
import './TrafficFlowDiagram.css';

/**
 * Chain node component
 */
function ChainNode({
  label,
  count,
  isActive,
  isHighlighted,
  onClick,
  x,
  y,
  width = 100,
  height = 40,
}: {
  label: string;
  count: number;
  isActive: boolean;
  isHighlighted: boolean;
  onClick?: () => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  const rx = 8; // border radius

  return (
    <g
      className={`chain-node ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      transform={`translate(${x}, ${y})`}
    >
      {/* Background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={rx}
        className={`
          transition-all duration-200
          ${
            isHighlighted
              ? 'fill-primary-100 stroke-primary-500 stroke-2 dark:fill-primary-950'
              : isActive
              ? 'fill-slate-100 stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500'
              : 'fill-slate-50 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600'
          }
        `}
      />

      {/* Label */}
      <text
        className={`text-xs font-medium ${
          isHighlighted
            ? 'fill-primary-700 dark:fill-primary-300'
            : 'fill-slate-700 dark:fill-slate-300'
        }`}
        textAnchor="middle"
        dy="-0.2em"
      >
        {label}
      </text>

      {/* Count badge */}
      {count > 0 && (
        <text
          className="text-[10px] fill-slate-500 dark:fill-slate-400"
          textAnchor="middle"
          dy="1.2em"
        >
          {count} rules
        </text>
      )}
    </g>
  );
}

/**
 * Arrow path component
 */
function ArrowPath({
  d,
  isAnimated,
  isHighlighted,
}: {
  d: string;
  isAnimated: boolean;
  isHighlighted: boolean;
}) {
  return (
    <>
      {/* Base path */}
      <path
        d={d}
        fill="none"
        className={`
          transition-all duration-200
          ${
            isHighlighted
              ? 'stroke-primary-500 stroke-2'
              : 'stroke-slate-300 dark:stroke-slate-600'
          }
        `}
        markerEnd="url(#arrowhead)"
      />
      {/* Animated overlay */}
      {isAnimated && (
        <path
          d={d}
          fill="none"
          className="traffic-flow-path stroke-primary-400 dark:stroke-primary-500"
          strokeDasharray="8,4"
        />
      )}
    </>
  );
}

export interface TrafficFlowDiagramProps {
  className?: string;
  activeChain?: FirewallChain | null;
  onChainClick?: (chain: FirewallChain) => void;
}

/**
 * TrafficFlowDiagram Component
 *
 * Features:
 * - Visual representation of packet flow through firewall chains
 * - Animated dashed lines showing traffic direction
 * - Interactive chain nodes (click to filter)
 * - Responsive design (horizontal on desktop, simplified on mobile)
 * - Shows rule counts per chain
 *
 * @param props - Component props
 * @returns Traffic flow diagram component
 */
export function TrafficFlowDiagram({
  className,
  activeChain,
  onChainClick,
}: TrafficFlowDiagramProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: filterRules } = useFilterRules(routerIp);
  const { data: natRules } = useNATRules(routerIp);

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

  // SVG dimensions
  const width = 700;
  const height = 200;

  // Node positions
  const nodes = {
    prerouting: { x: 80, y: 50 },
    routing: { x: 220, y: 50 },
    forward: { x: 420, y: 50 },
    postrouting: { x: 580, y: 50 },
    input: { x: 220, y: 150 },
    local: { x: 350, y: 150 },
    output: { x: 480, y: 150 },
  };

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-2 mb-4">
        <h2 className="text-lg font-semibold">Traffic Flow</h2>
        <p className="text-sm text-muted-foreground">
          Packet path through firewall chains
        </p>
      </div>

      {/* Diagram container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[600px]"
          style={{ maxHeight: '250px' }}
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
                className="fill-slate-400 dark:fill-slate-500"
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
              <polygon points="0 0, 10 3.5, 0 7" className="fill-primary-500" />
            </marker>
          </defs>

          {/* Connection paths */}
          <g className="paths">
            {/* IN -> Prerouting */}
            <ArrowPath
              d={`M 10,50 L ${nodes.prerouting.x - 55},50`}
              isAnimated
              isHighlighted={activeChain === 'prerouting'}
            />

            {/* Prerouting -> Routing */}
            <ArrowPath
              d={`M ${nodes.prerouting.x + 55},50 L ${nodes.routing.x - 50},50`}
              isAnimated
              isHighlighted={activeChain === 'prerouting'}
            />

            {/* Routing -> Forward */}
            <ArrowPath
              d={`M ${nodes.routing.x + 50},50 L ${nodes.forward.x - 55},50`}
              isAnimated
              isHighlighted={activeChain === 'forward'}
            />

            {/* Forward -> Postrouting */}
            <ArrowPath
              d={`M ${nodes.forward.x + 55},50 L ${nodes.postrouting.x - 60},50`}
              isAnimated
              isHighlighted={activeChain === 'forward' || activeChain === 'postrouting'}
            />

            {/* Postrouting -> OUT */}
            <ArrowPath
              d={`M ${nodes.postrouting.x + 60},50 L ${width - 10},50`}
              isAnimated
              isHighlighted={activeChain === 'postrouting'}
            />

            {/* Routing -> Input (down) */}
            <ArrowPath
              d={`M ${nodes.routing.x},70 L ${nodes.routing.x},${nodes.input.y - 20}`}
              isAnimated
              isHighlighted={activeChain === 'input'}
            />

            {/* Input -> Local */}
            <ArrowPath
              d={`M ${nodes.input.x + 55},150 L ${nodes.local.x - 55},150`}
              isAnimated
              isHighlighted={activeChain === 'input'}
            />

            {/* Local -> Output */}
            <ArrowPath
              d={`M ${nodes.local.x + 55},150 L ${nodes.output.x - 55},150`}
              isAnimated
              isHighlighted={activeChain === 'output'}
            />

            {/* Output -> Postrouting (up) */}
            <ArrowPath
              d={`M ${nodes.output.x + 20},130 Q ${nodes.output.x + 60},100 ${nodes.postrouting.x - 30},70`}
              isAnimated
              isHighlighted={activeChain === 'output' || activeChain === 'postrouting'}
            />
          </g>

          {/* Labels */}
          <g className="labels">
            <text
              x={10}
              y={35}
              className="text-xs fill-slate-500 dark:fill-slate-400"
            >
              IN
            </text>
            <text
              x={width - 30}
              y={35}
              className="text-xs fill-slate-500 dark:fill-slate-400"
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
              onClick={() => onChainClick?.('prerouting')}
              x={nodes.prerouting.x}
              y={nodes.prerouting.y}
              width={100}
              height={40}
            />

            {/* Routing Decision (not clickable) */}
            <g transform={`translate(${nodes.routing.x}, ${nodes.routing.y})`}>
              <rect
                x={-45}
                y={-20}
                width={90}
                height={40}
                rx={4}
                className="fill-slate-200 stroke-slate-400 dark:fill-slate-600 dark:stroke-slate-500"
                style={{ transform: 'rotate(45deg) scale(0.7)' }}
              />
              <text
                className="text-[9px] font-medium fill-slate-600 dark:fill-slate-300"
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
              onClick={() => onChainClick?.('forward')}
              x={nodes.forward.x}
              y={nodes.forward.y}
              width={100}
              height={40}
            />

            <ChainNode
              label="POSTROUTING"
              count={chainCounts.postrouting}
              isActive={chainCounts.postrouting > 0}
              isHighlighted={activeChain === 'postrouting'}
              onClick={() => onChainClick?.('postrouting')}
              x={nodes.postrouting.x}
              y={nodes.postrouting.y}
              width={110}
              height={40}
            />

            <ChainNode
              label="INPUT"
              count={chainCounts.input}
              isActive={chainCounts.input > 0}
              isHighlighted={activeChain === 'input'}
              onClick={() => onChainClick?.('input')}
              x={nodes.input.x}
              y={nodes.input.y}
              width={100}
              height={40}
            />

            {/* Local Process (not clickable) */}
            <g transform={`translate(${nodes.local.x}, ${nodes.local.y})`}>
              <rect
                x={-50}
                y={-20}
                width={100}
                height={40}
                rx={20}
                className="fill-secondary-100 stroke-secondary-400 dark:fill-secondary-950 dark:stroke-secondary-600"
              />
              <text
                className="text-[10px] font-medium fill-secondary-700 dark:fill-secondary-300"
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
              onClick={() => onChainClick?.('output')}
              x={nodes.output.x}
              y={nodes.output.y}
              width={100}
              height={40}
            />
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 px-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-slate-400 dark:bg-slate-500" />
          Packet flow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-primary-400" />
          Active traffic
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-slate-100 border border-slate-300 dark:bg-slate-700 dark:border-slate-600" />
          Chain (click to filter)
        </span>
      </div>
    </div>
  );
}


