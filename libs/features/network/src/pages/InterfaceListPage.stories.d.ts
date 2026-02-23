/**
 * InterfaceListPage Storybook Stories
 *
 * Page-level stories for the Network Interfaces management page.
 * Covers default, loading, empty, and error states.
 */
import { InterfaceListPage } from './InterfaceListPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceListPage>;
export default meta;
type Story = StoryObj<typeof InterfaceListPage>;
/**
 * Default – page with a standard router ID, ready to fetch interface data.
 */
export declare const Default: Story;
/**
 * DifferentRouter – demonstrates that passing a different routerId changes the
 * data context for all child components.
 */
export declare const DifferentRouter: Story;
/**
 * DefaultRouterFallback – no routerId prop provided; the page falls back to
 * the built-in default value of \`"default-router"\`.
 */
export declare const DefaultRouterFallback: Story;
/**
 * MobileViewport – same page rendered within a mobile-width viewport to verify
 * that the InterfaceList Platform Presenter switches to its mobile layout.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=InterfaceListPage.stories.d.ts.map