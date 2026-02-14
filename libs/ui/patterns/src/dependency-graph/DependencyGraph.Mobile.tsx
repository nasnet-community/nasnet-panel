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

import { StatusBadge } from '../status-badge';
import type { DependencyGraphPresenterProps, EnhancedNode } from './dependency-graph.types';

/**
 * Mobile Presenter for Dependency Graph
 *
 * Features:
 * - Collapsible layers (accordion-style)
 * - 44px minimum touch targets
 * - Layer-by-layer navigation
 * - Service cards with status badges
 */
export function DependencyGraphMobile({
  state,
  className,
  loading,
  error,
  emptyMessage,
}: DependencyGraphPresenterProps) {
  const [expandedLayers, setExpandedLayers] = React.useState<Set<number>>(
    new Set([0]) // Expand layer 0 by default
  );

  // Toggle layer expansion
  const toggleLayer = (layerNumber: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerNumber)) {
        next.delete(layerNumber);
      } else {
        next.add(layerNumber);
      }
      return next;
    });
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Dependencies</CardTitle>
        <CardDescription>
          {state.nodeCount} {state.nodeCount === 1 ? 'service' : 'services'},{' '}
          {state.edgeCount} {state.edgeCount === 1 ? 'dependency' : 'dependencies'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {state.layers.map((layer) => {
          const isExpanded = expandedLayers.has(layer.layerNumber);

          return (
            <div key={layer.layerNumber} className="space-y-1">
              {/* Layer header - collapsible */}
              <button
                type="button"
                onClick={() => toggleLayer(layer.layerNumber)}
                className={cn(
                  'w-full flex items-center justify-between',
                  'min-h-[44px] px-3 py-2 rounded-lg',
                  'bg-muted/50 hover:bg-muted transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-expanded={isExpanded}
                aria-controls={`layer-${layer.layerNumber}-content`}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    Layer {layer.layerNumber}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {layer.count} {layer.count === 1 ? 'service' : 'services'}
                </span>
              </button>

              {/* Layer content - nodes */}
              {isExpanded && (
                <div
                  id={`layer-${layer.layerNumber}-content`}
                  className="space-y-2 pl-4 pt-1 pb-2"
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
}

/**
 * Node Card Component
 */
interface NodeCardProps {
  node: EnhancedNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

function NodeCard({ node, isSelected, onSelect }: NodeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.instanceId)}
      className={cn(
        'w-full min-h-[44px] p-3 rounded-lg',
        'flex items-center justify-between gap-3',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected
          ? 'bg-primary/10 border border-primary'
          : 'bg-card border border-border hover:bg-accent'
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <StatusBadge status={node.status as 'online' | 'offline' | 'pending'} size="sm" />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium truncate w-full text-left">
            {node.instanceName}
          </span>
          <span className="text-xs text-muted-foreground truncate w-full text-left">
            {node.featureId}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end text-xs text-muted-foreground flex-shrink-0">
        <span>↑ {node.dependenciesCount}</span>
        <span>↓ {node.dependentsCount}</span>
      </div>
    </button>
  );
}
