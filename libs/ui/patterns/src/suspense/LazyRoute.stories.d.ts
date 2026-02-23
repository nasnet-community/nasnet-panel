/**
 * LazyRoute Storybook Stories
 *
 * Demonstrates the createLazyRoute, preloadRoutes, and createPreloadHandlers
 * utilities. Because these helpers produce TanStack Router configuration
 * objects rather than renderable components, each story wraps the utility
 * output inside a React.Suspense boundary to show the resulting UI states.
 *
 * @module @nasnet/ui/patterns/suspense
 */
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Wrapper component for Storybook — routes stories by scenario name.
 */
declare function LazyRouteDemo({ scenario }: {
    scenario: string;
}): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof LazyRouteDemo>;
export default meta;
type Story = StoryObj<typeof LazyRouteDemo>;
/**
 * The pending (loading) state — shows the skeleton configured in createLazyRoute
 * while the lazy component resolves.
 */
export declare const PendingSkeleton: Story;
/**
 * The resolved (loaded) state — the lazy component has resolved and rendered.
 */
export declare const ResolvedComponent: Story;
/**
 * Error state — the lazy import failed and the custom errorComponent is shown.
 */
export declare const ErrorFallback: Story;
/**
 * Demonstrates createPreloadHandlers — hover/focus an element to fire the import.
 */
export declare const PreloadOnHover: Story;
/**
 * A customized skeleton that matches the shape of the page being loaded.
 */
export declare const CustomSkeleton: Story;
//# sourceMappingURL=LazyRoute.stories.d.ts.map