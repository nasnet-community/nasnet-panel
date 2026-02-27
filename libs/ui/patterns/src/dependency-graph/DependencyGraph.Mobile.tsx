/**
 * Dependency Graph Mobile Presenter
 *
 * Mobile-optimized presenter with collapsible tree-list view.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */

import * as React from 'react';

import { ChevronDown, ChevronRight, GitBranch, AlertCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  cn,
  Skeleton,
} from '@nasnet/ui/primitives';

import { StatusIndicator } from '../status-indicator';

import type { DependencyGraphPresenterProps, EnhancedNode } from './dependency-graph.types';

/**
 * Mobile Presenter for Dependency Graph
 *
 * Optimized for mobile devices (<640px) with collapsible accordion-style layout.
 *
 * Features:
 * - Collapsible layers (accordion-style)
 * - 44px minimum touch targets (WCAG AAA)
 * - Layer-by-layer navigation
 * - Service instance cards with status badges
 * - Dependency/dependent counts
 *
 * @param props Presenter props with state, loading, error, and display options
 */
const DependencyGraphMobileInner = ({
  state,
  className,
  loading,
  error,
  emptyMessage,
}: DependencyGraphPresenterProps) => {
  const [expandedLayers, setExpandedLayers] = React.useState<Set<number>>(
    new Set([0]) // Expand layer 0 by default
  );

  // Toggle layer expansion with useCallback
  const toggleLayer = React.useCallback((layerNumber: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerNumber)) {
        next.delete(layerNumber);
      } else {
        next.add(layerNumber);
      }
      return next;
    });
  }, []);

  // Loading state
  if (loading) {
    return (
      <Card
        className={cn(
          'bg-card border-border w-full rounded-[var(--semantic-radius-card)] border p-4 shadow-[var(--semantic-shadow-card)] sm:p-6',
          className
        )}
      >
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        className={cn(
          'bg-card border-error w-full rounded-[var(--semantic-radius-card)] border p-4 shadow-[var(--semantic-shadow-card)] sm:p-6',
          className
        )}
      >
        <CardContent className="pt-6">
          <div className="text-error flex items-center gap-3">
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
      <Card
        className={cn(
          'bg-card border-border w-full rounded-[var(--semantic-radius-card)] border p-4 shadow-[var(--semantic-shadow-card)] sm:p-6',
          className
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GitBranch className="text-muted-foreground mb-3 h-12 w-12" />
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-card border-border w-full rounded-[var(--semantic-radius-card)] border p-4 shadow-[var(--semantic-shadow-card)] sm:p-6',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Dependencies</CardTitle>
        <CardDescription>
          {state.nodeCount} {state.nodeCount === 1 ? 'service' : 'services'}, {state.edgeCount}{' '}
          {state.edgeCount === 1 ? 'dependency' : 'dependencies'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {state.layers.map((layer) => {
          const isExpanded = expandedLayers.has(layer.layerNumber);

          return (
            <div
              key={layer.layerNumber}
              className="space-y-1"
            >
              {/* Layer header - collapsible */}
              <button
                type="button"
                onClick={() => toggleLayer(layer.layerNumber)}
                className={cn(
                  'flex w-full items-center justify-between',
                  'min-h-[44px] rounded-lg px-3 py-2',
                  'bg-muted hover:bg-muted/80 transition-colors',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                )}
                aria-expanded={isExpanded}
                aria-controls={`layer-${layer.layerNumber}-content`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ?
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  : <ChevronRight className="text-muted-foreground h-4 w-4" />}
                  <span className="text-sm font-medium">Layer {layer.layerNumber}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {layer.count} {layer.count === 1 ? 'service' : 'services'}
                </span>
              </button>

              {/* Layer content - nodes */}
              {isExpanded && (
                <div
                  id={`layer-${layer.layerNumber}-content`}
                  className="space-y-2 pb-2 pl-4 pt-1"
                  role="region"
                  aria-label={`Layer ${layer.layerNumber} services`}
                >
                  {layer.nodes.map((node) => (
                    <NodeCard
                      key={node.instanceId}
                      node={node}
                      isSelected={state.selectedNode?.instanceId === node.instanceId}
                      onSelect={state.handleNodeSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

DependencyGraphMobileInner.displayName = 'DependencyGraphMobile';

/**
 * DependencyGraphMobile - Mobile presenter for dependency graph
 */
const DependencyGraphMobile = React.memo(DependencyGraphMobileInner);
DependencyGraphMobile.displayName = 'DependencyGraphMobile';

/**
 * Node Card Component - Service instance card for mobile display
 */
interface NodeCardProps {
  node: EnhancedNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

const NodeCardInner = ({ node, isSelected, onSelect }: NodeCardProps) => (
  <button
    type="button"
    onClick={() => onSelect(node.instanceId)}
    className={cn(
      'min-h-[44px] w-full rounded-lg p-3',
      'flex items-center justify-between gap-3',
      'transition-colors',
      'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      isSelected ?
        'bg-primary/20 border-primary text-primary border'
      : 'bg-card border-border hover:bg-muted/50 border'
    )}
    aria-pressed={isSelected}
  >
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <StatusIndicator
        status={node.status as 'online' | 'offline' | 'pending'}
        size="sm"
      />
      <div className="flex min-w-0 flex-col items-start">
        <span className="w-full truncate text-left text-sm font-medium">{node.instanceName}</span>
        <span className="text-muted-foreground w-full truncate text-left text-xs">
          {node.featureId}
        </span>
      </div>
    </div>
    <div className="text-muted-foreground flex flex-shrink-0 flex-col items-end text-xs">
      <span>↑ {node.dependenciesCount}</span>
      <span>↓ {node.dependentsCount}</span>
    </div>
  </button>
);

NodeCardInner.displayName = 'NodeCard';
const NodeCard = React.memo(NodeCardInner);

export { DependencyGraphMobile };
