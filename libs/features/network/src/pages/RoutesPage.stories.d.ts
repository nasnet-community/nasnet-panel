/**
 * RoutesPage Storybook Stories
 *
 * Page-level stories for the Static Route Management page.
 * Covers default state, mobile viewport, and key interaction entry-points.
 */
import { RoutesPage } from './RoutesPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RoutesPage>;
export default meta;
type Story = StoryObj<typeof RoutesPage>;
/**
 * Default – page mounted with a demo router ID; the RouteList fetches and
 * renders whatever routes the mock Apollo layer returns.
 */
export declare const Default: Story;
/**
 * DifferentRouter – demonstrates re-scoping the entire page to a secondary router.
 */
export declare const DifferentRouter: Story;
/**
 * DefaultRouterFallback – no routerId supplied; falls back to "default-router".
 */
export declare const DefaultRouterFallback: Story;
/**
 * MobileViewport – renders the page at 375 px to verify the Sheet-based form
 * and touch-friendly route list layout.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=RoutesPage.stories.d.ts.map