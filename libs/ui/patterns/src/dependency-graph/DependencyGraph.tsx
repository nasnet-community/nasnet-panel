/**
 * Dependency Graph Component
 *
 * Main component that auto-detects platform and renders the appropriate presenter.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * Features:
 * - Headless hook with all business logic
 * - Auto-detection with CSS media queries (SSR-safe)
 * - Mobile & Desktop presenters with platform-optimized layouts
 * - Topological layer computation
 * - Interactive node selection with dependency highlighting
 * - Loading, error, and empty states
 * - WCAG AAA accessible
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { DependencyGraphDesktop } from './DependencyGraph.Desktop';
import { DependencyGraphMobile } from './DependencyGraph.Mobile';
import { useDependencyGraph } from './use-dependency-graph';

import type { DependencyGraphProps } from './dependency-graph.types';

/**
 * Dependency Graph Component
 *
 * Visualizes service instance dependencies as an interactive graph.
 * Auto-detects platform (mobile/desktop) and renders the appropriate presenter.
 *
 * The headless hook (`useDependencyGraph`) handles all business logic including
 * topological sorting and node selection, while presenters handle rendering.
 *
 * @example
 * ```tsx
 * // Basic usage with auto-detection
 * <DependencyGraph
 *   graph={dependencyGraph}
 *   onNodeSelect={(id) => console.log('Selected:', id)}
 * />
 *
 * // With controlled selection
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
const DependencyGraphInner = React.forwardRef<
  HTMLDivElement,
  DependencyGraphProps
>(
  (
    {
      graph,
      selectedNodeId,
      onNodeSelect,
      onViewportChange,
      variant = 'auto',
      className,
      loading = false,
      error = null,
      emptyMessage = 'No dependencies configured',
    },
    ref
  ) => {
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
      <div
        ref={ref}
        className={cn('contents', className)}
        role="img"
        aria-label="Service dependency graph"
      >
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
);

DependencyGraphInner.displayName = 'DependencyGraph';

/**
 * DependencyGraph - Service dependency visualization component
 */
const DependencyGraph = React.memo(DependencyGraphInner);
DependencyGraph.displayName = 'DependencyGraph';

export { DependencyGraph };
