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
import type { DependencyGraphProps } from './dependency-graph.types';
/**
 * DependencyGraph - Service dependency visualization component
 */
declare const DependencyGraph: React.MemoExoticComponent<React.ForwardRefExoticComponent<DependencyGraphProps & React.RefAttributes<HTMLDivElement>>>;
export { DependencyGraph };
//# sourceMappingURL=DependencyGraph.d.ts.map