/**
 * NetworkTopology.Desktop
 *
 * Desktop presenter for the Network Topology visualization.
 * Renders a full SVG diagram with all nodes and connections.
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import { memo, useRef, useState, useCallback, useEffect } from 'react';

import { cn, useReducedMotion } from '@nasnet/ui/primitives';

import { ConnectionPath, ConnectionPathStatic } from './ConnectionPath';
import { RouterIcon, WanIcon, LanIcon, DeviceIcon } from './icons';
import { TopologyTooltip } from './TopologyTooltip';
import { useNetworkTopology } from './useNetworkTopology';

import type { NetworkTopologyProps, TopologyNode, TooltipContent } from './types';

export interface NetworkTopologyDesktopProps extends NetworkTopologyProps {
  /** Show devices in the topology */
  showDevices?: boolean;
}

/**
 * Topology node wrapper with tooltip and keyboard support
 */
interface TopologyNodeElementProps {
  node: TopologyNode;
  tooltipContent: TooltipContent | null;
  onKeyDown: (event: React.KeyboardEvent, nodeId: string) => void;
  reducedMotion: boolean;
}

const TopologyNodeElement = memo(function TopologyNodeElement({
  node,
  tooltipContent,
  onKeyDown,
  reducedMotion,
}: TopologyNodeElementProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setTooltipOpen((prev) => !prev);
      } else {
        onKeyDown(event, node.id);
      }
    },
    [node.id, onKeyDown]
  );

  const handleFocus = useCallback(() => setTooltipOpen(true), []);
  const handleBlur = useCallback(() => setTooltipOpen(false), []);

  // Render the appropriate icon based on node type
  const renderIcon = () => {
    switch (node.type) {
      case 'router':
        return (
          <RouterIcon
            size={64}
            status={node.status as 'online' | 'offline' | 'unknown'}
          />
        );
      case 'wan':
        return (
          <WanIcon
            size={48}
            status={node.status as 'connected' | 'disconnected' | 'pending'}
          />
        );
      case 'lan':
        return (
          <LanIcon
            size={48}
            status={node.status === 'connected' ? 'connected' : 'disconnected'}
            deviceCount={(node.data as { deviceCount?: number }).deviceCount}
          />
        );
      case 'device':
        return (
          <DeviceIcon
            size={32}
            type={
              (node.data as { type?: string }).type as
                | 'computer'
                | 'phone'
                | 'tablet'
                | 'iot'
                | 'unknown'
            }
            status={node.status as 'online' | 'offline'}
          />
        );
      default:
        return null;
    }
  };

  // Calculate icon offset for centering
  const iconSize =
    node.type === 'router' ? 64
    : node.type === 'device' ? 32
    : 48;
  const iconOffset = iconSize / 2;

  return (
    <TopologyTooltip
      content={tooltipContent}
      open={tooltipOpen}
      onOpenChange={setTooltipOpen}
      side="top"
    >
      <g
        id={`topology-node-${node.id}`}
        className={cn(
          'cursor-pointer outline-none',
          'focus-visible:outline-none',
          !reducedMotion && 'transition-transform duration-150 hover:scale-105'
        )}
        transform={`translate(${node.position.x - iconOffset}, ${node.position.y - iconOffset})`}
        tabIndex={0}
        role="button"
        aria-label={`${node.label}${node.sublabel ? `, ${node.sublabel}` : ''}, Status: ${node.status}`}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {/* Focus ring indicator */}
        <rect
          x="-4"
          y="-4"
          width={iconSize + 8}
          height={iconSize + 8}
          rx="8"
          fill="none"
          stroke="hsl(var(--ring))"
          strokeWidth="3"
          className="opacity-0 focus-visible:opacity-100"
          style={{ pointerEvents: 'none' }}
        />

        {/* Icon */}
        <foreignObject
          width={iconSize}
          height={iconSize}
        >
          <div className="flex h-full w-full items-center justify-center">{renderIcon()}</div>
        </foreignObject>

        {/* Label below icon */}
        <text
          x={iconOffset}
          y={iconSize + 16}
          textAnchor="middle"
          className="fill-foreground text-xs font-medium"
        >
          {node.label}
        </text>

        {/* Sublabel (IP, CIDR, etc.) */}
        {node.sublabel && (
          <text
            x={iconOffset}
            y={iconSize + 30}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {node.sublabel}
          </text>
        )}
      </g>
    </TopologyTooltip>
  );
});

/**
 * NetworkTopologyDesktop
 *
 * Full SVG visualization of the network topology for desktop screens.
 * Features:
 * - Router at center with WAN on left, LAN on right
 * - Curved bezier connections between nodes
 * - Interactive tooltips on hover/focus
 * - Keyboard navigation support
 */
export const NetworkTopologyDesktop = memo(function NetworkTopologyDesktop(
  props: NetworkTopologyDesktopProps
) {
  const { className, showDevices = true, ...topologyProps } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const reducedMotion = useReducedMotion();

  // Track container dimensions for responsive scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(200, height),
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Get topology data from headless hook
  const { nodes, connections, viewBox, getTooltipContent, handleKeyNavigation } =
    useNetworkTopology(topologyProps, {
      containerWidth: dimensions.width,
      containerHeight: dimensions.height,
      showDevices,
    });

  // Use static paths when reduced motion is preferred
  const PathComponent = reducedMotion ? ConnectionPathStatic : ConnectionPath;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative min-h-[300px] w-full overflow-hidden',
        'bg-card border-border rounded-[var(--semantic-radius-card)] border',
        'shadow-[var(--semantic-shadow-card)]',
        className
      )}
    >
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        role="img"
        aria-label="Network topology diagram showing router, WAN interfaces, and LAN networks"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Network Topology</title>
        <desc>
          Visual diagram of the network configuration showing the router at center with WAN
          connections on the left and LAN networks on the right.
          {showDevices && ' Connected devices are shown on the far right.'}
        </desc>

        {/* Connection paths layer (behind nodes) */}
        <g className="connections">
          {connections.map((conn) => (
            <PathComponent
              key={conn.id}
              id={conn.id}
              path={conn.path}
              status={conn.status}
              animate={!reducedMotion}
            />
          ))}
        </g>

        {/* Nodes layer */}
        <g className="nodes">
          {nodes.map((node) => (
            <TopologyNodeElement
              key={node.id}
              node={node}
              tooltipContent={getTooltipContent(node.id)}
              onKeyDown={handleKeyNavigation}
              reducedMotion={reducedMotion}
            />
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div
        className={cn(
          'bg-card/90 absolute bottom-2 left-2 flex gap-4 rounded-[var(--semantic-radius-input)] px-3 py-1.5',
          'text-muted-foreground border-border border text-xs backdrop-blur-sm'
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="bg-success h-2 w-2 rounded-full" />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-muted-foreground h-2 w-2 rounded-full" />
          <span>Disconnected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-warning h-2 w-2 rounded-full" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
});

NetworkTopologyDesktop.displayName = 'NetworkTopologyDesktop';
