/**
 * Dependency Graph Mobile Presenter
 *
 * Mobile-optimized presenter with collapsible tree-list view.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */
import * as React from 'react';
import type { DependencyGraphPresenterProps } from './dependency-graph.types';
/**
 * DependencyGraphMobile - Mobile presenter for dependency graph
 */
declare const DependencyGraphMobile: React.MemoExoticComponent<{
    ({ state, className, loading, error, emptyMessage, }: DependencyGraphPresenterProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}>;
export { DependencyGraphMobile };
//# sourceMappingURL=DependencyGraph.Mobile.d.ts.map