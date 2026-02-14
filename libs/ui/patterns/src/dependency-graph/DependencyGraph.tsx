/**
 * Dependency Graph Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import type { DependencyGraphProps } from './dependency-graph.types';
import { useDependencyGraph } from './use-dependency-graph';
import { DependencyGraphDesktop } from './DependencyGraph.Desktop';
import { DependencyGraphMobile } from './DependencyGraph.Mobile';

/**
 * Dependency Graph Component
 *
 * Visualizes service instance dependencies as an interactive graph.
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 *
 * Features:
 * - Topological layer computation
 * - Interactive node selection
 * - Dependency/dependent highlighting
 * - Mobile: Collapsible tree-list by layers
 * - Desktop: SVG graph with zoom/pan
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DependencyGraph
 *   graph={dependencyGraph}
 *   onNodeSelect={(id) => console.log('Selected:', id)}
 * />
 *
 * // With selection
 * <DependencyGraph
 *   graph={dependencyGraph}
 *   selectedNodeId={selectedId}
 *   onNodeSelect={setSelectedId}
 * />
 *
 * // Force mobile variant
 * <DependencyGraph
 *   graph={dependencyGraph}
 *   variant="mobile"
 * />
 * ```
 */
export function DependencyGraph({
  graph,
  selectedNodeId,
  onNodeSelect,
  onViewportChange,
  variant = 'auto',
  className,
  loading = false,
  error = null,
  emptyMessage = 'No dependencies configured',
}: DependencyGraphProps) {
  // Compute state using the headless hook
  const state = useDependencyGraph({
    graph,
    selectedNodeId,
    onNodeSelect,
    onViewportChange,
  });

  // Props for presenters
  const presenterProps = {
    state,
    className,
    loading,
    error,
    emptyMessage,
  };

  // Forced variant rendering
  if (variant === 'mobile') {
    return <DependencyGraphMobile {...presenterProps} />;
  }

  if (variant === 'desktop') {
    return <DependencyGraphDesktop {...presenterProps} />;
  }

  // Auto-detect: Use CSS media queries for SSR compatibility
  // This avoids hydration mismatches and works on first render
  return (
    <div className={cn('contents', className)} role="img" aria-label="Service dependency graph">
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <DependencyGraphMobile {...presenterProps} className="" />
      </div>

      {/* Desktop: shown on larger screens (>=640px) */}
      <div className="hidden sm:block">
        <DependencyGraphDesktop {...presenterProps} className="" />
      </div>
    </div>
  );
}
