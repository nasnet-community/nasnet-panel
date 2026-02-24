/**
 * Storybook stories for RoutingTable
 *
 * RoutingTable fetches route data via useRoutes() (Apollo) and reads the
 * current router IP from Zustand. Because these data sources are unavailable
 * in Storybook, we provide static render stories that replicate the distinct
 * visual states of the component:
 *
 *  - Loading skeleton
 *  - Error state
 *  - Empty state
 *  - Populated table (active / dynamic / disabled / default route variants)
 *
 * The static stories use a thin wrapper that reproduces the exact JSX the
 * component renders for each state, keeping the stories tightly coupled to
 * the real component structure.
 */
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Dummy component used as the Storybook "component" so argTypes and autodocs
 * are attached to the correct display name. The actual stories use render()
 * for static states.
 */
declare function RoutingTablePlaceholder(_props: {
    className?: string;
}): null;
declare namespace RoutingTablePlaceholder {
    var displayName: string;
}
declare const meta: Meta<typeof RoutingTablePlaceholder>;
export default meta;
type Story = StoryObj<typeof RoutingTablePlaceholder>;
/**
 * Fully populated table with all route variant types: default gateway,
 * dynamic connected routes, a disabled route, a blackhole and an unreachable.
 */
export declare const Populated: Story;
/**
 * Single default-route-only view — highlights the blue left-border and "(default)" label.
 */
export declare const DefaultRouteHighlighted: Story;
/**
 * Only active routes (active=true, disabled=false) — green row highlights.
 */
export declare const ActiveRoutesOnly: Story;
/**
 * Includes a disabled route — shows strikethrough on gateway/interface cells
 * and muted row styling.
 */
export declare const WithDisabledRoute: Story;
/**
 * Loading skeleton — matches the skeleton the real component renders while
 * the Apollo query is in flight.
 */
export declare const LoadingState: Story;
/**
 * Error state — matches the red error message shown when the Apollo query fails.
 */
export declare const ErrorState: Story;
/**
 * Empty state — no routes returned from the router.
 */
export declare const EmptyState: Story;
//# sourceMappingURL=RoutingTable.stories.d.ts.map