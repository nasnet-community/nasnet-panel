/**
 * Dependency Graph Desktop Presenter
 *
 * Desktop-optimized presenter with interactive SVG graph.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */

import * as React from 'react';
import { AlertCircle, GitBranch } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
} from '@nasnet/ui/primitives';

import type { DependencyGraphPresenterProps, EnhancedNode, EnhancedEdge } from './dependency-graph.types';

/**
 * Desktop Presenter for Dependency Graph
 *
 * Features:
 * - Interactive SVG graph with layer-based layout
 * - Node selection and highlighting
 * - Hover tooltips
 * - Keyboard navigation
 * - Statistics sidebar
 */
export function DependencyGraphDesktop({
  state,
  className,
  loading,
  error,
  emptyMessage,
}: DependencyGraphPresenterProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  // Loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('w-full border-destructive', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (state.isEmpty) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex gap-4', className)}>
      {/* Main graph area */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dependency Graph</CardTitle>
          <CardDescription>
            {state.nodeCount} {state.nodeCount === 1 ? 'service' : 'services'},{' '}
            {state.edgeCount} {state.edgeCount === 1 ? 'dependency' : 'dependencies'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GraphVisualization
            state={state}
            svgRef={svgRef}
            hoveredNode={hoveredNode}
            onHoverNode={setHoveredNode}
          />
        </CardContent>
      </Card>

      {/* Statistics sidebar */}
      <Card className="w-64 flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Services</p>
            <p className="text-2xl font-bold">{state.nodeCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Dependencies</p>
            <p className="text-2xl font-bold">{state.edgeCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Depth</p>
            <p className="text-2xl font-bold">{state.maxDepth}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Root Services</p>
            <p className="text-lg font-semibold">{state.rootNodes.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Leaf Services</p>
            <p className="text-lg font-semibold">{state.leafNodes.length}</p>
          </div>

          {state.selectedNode && (
            <>
              <hr className="border-border" />
              <div>
                <p className="text-muted-foreground mb-1">Selected</p>
                <p className="font-medium truncate">{state.selectedNode.instanceName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {state.selectedNode.featureId}
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p>Depends on: {state.selectedNode.dependenciesCount}</p>
                  <p>Required by: {state.selectedNode.dependentsCount}</p>
                  <p>Layer: {state.selectedNode.layer}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Graph Visualization Component
 */
interface GraphVisualizationProps {
  state: DependencyGraphPresenterProps['state'];
  svgRef: React.RefObject<SVGSVGElement>;
  hoveredNode: string | null;
  onHoverNode: (nodeId: string | null) => void;
}

function GraphVisualization({ state, svgRef, hoveredNode, onHoverNode }: GraphVisualizationProps) {
  const width = 800;
  const height = 500;
  const nodeRadius = 30;
  const layerSpacing = 150;
  const nodeSpacing = 80;

  // Compute layout: position nodes by layer
  const nodesWithLayout = React.useMemo(() => {
    return state.nodes.map((node) => {
      // Nodes in the same layer
      const layerNodes = state.layers.find((l) => l.layerNumber === node.layer)?.nodes || [];
      const indexInLayer = layerNodes.findIndex((n) => n.instanceId === node.instanceId);
      const layerSize = layerNodes.length;

      // Center the layer vertically
      const layerHeight = (layerSize - 1) * nodeSpacing;
      const layerStartY = (height - layerHeight) / 2;

      return {
        ...node,
        x: 100 + node.layer * layerSpacing,
        y: layerStartY + indexInLayer * nodeSpacing,
      };
    });
  }, [state.nodes, state.layers, height]);

  return (
    <div className="relative w-full h-[500px] bg-muted/20 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        role="img"
        aria-label="Service dependency graph"
      >
        {/* Edges (draw first, so they're behind nodes) */}
        <g className="edges">
          {state.edges.map((edge) => {
            const fromNode = nodesWithLayout.find((n) => n.instanceId === edge.fromInstanceId);
            const toNode = nodesWithLayout.find((n) => n.instanceId === edge.toInstanceId);

            if (!fromNode || !toNode) return null;

            const isHighlighted =
              state.selectedNode?.instanceId === fromNode.instanceId ||
              state.selectedNode?.instanceId === toNode.instanceId ||
              hoveredNode === fromNode.instanceId ||
              hoveredNode === toNode.instanceId;

            return (
              <EdgePath
                key={edge.id}
                from={{ x: fromNode.x!, y: fromNode.y! }}
                to={{ x: toNode.x!, y: toNode.y! }}
                isRequired={edge.dependencyType === 'REQUIRES'}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodesWithLayout.map((node) => {
            const isSelected = state.selectedNode?.instanceId === node.instanceId;
            const isHovered = hoveredNode === node.instanceId;

            return (
              <NodeCircle
                key={node.instanceId}
                node={node}
                x={node.x!}
                y={node.y!}
                radius={nodeRadius}
                isSelected={isSelected}
                isHovered={isHovered}
                onSelect={state.handleNodeSelect}
                onHover={onHoverNode}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/**
 * Edge Path Component
 */
interface EdgePathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isRequired: boolean;
  isHighlighted: boolean;
}

function EdgePath({ from, to, isRequired, isHighlighted }: EdgePathProps) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
      strokeWidth={isHighlighted ? 2 : 1}
      strokeDasharray={isRequired ? '0' : '4,4'}
      markerEnd="url(#arrowhead)"
      className="transition-all"
    />
  );
}

/**
 * Node Circle Component
 */
interface NodeCircleProps {
  node: EnhancedNode;
  x: number;
  y: number;
  radius: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

function NodeCircle({ node, x, y, radius, isSelected, isHovered, onSelect, onHover }: NodeCircleProps) {
  // Status color mapping
  const statusColor =
    node.status === 'RUNNING'
      ? 'hsl(var(--success))'
      : node.status === 'STOPPED'
      ? 'hsl(var(--muted))'
      : 'hsl(var(--warning))';

  return (
    <g
      onClick={() => onSelect(node.instanceId)}
      onMouseEnter={() => onHover(node.instanceId)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${node.instanceName} - ${node.featureId} - ${node.status}`}
    >
      {/* Outer ring (selection/hover) */}
      {(isSelected || isHovered) && (
        <circle
          cx={x}
          cy={y}
          r={radius + 4}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          className="transition-all"
        />
      )}

      {/* Node circle */}
      <circle cx={x} cy={y} r={radius} fill={statusColor} opacity={0.2} stroke={statusColor} strokeWidth={2} />

      {/* Node label */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium fill-foreground pointer-events-none select-none"
      >
        {node.instanceName.substring(0, 8)}
      </text>
    </g>
  );
}
