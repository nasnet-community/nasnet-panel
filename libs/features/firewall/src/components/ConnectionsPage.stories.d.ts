/**
 * Storybook stories for ConnectionsPage
 *
 * Demonstrates the connection tracking page with its tabbed interface:
 * the active connections list and the connection tracking settings panel.
 *
 * Note: This page component depends heavily on router hooks (useParams) and
 * data-fetching hooks. Stories showcase the UI shell and tab navigation using
 * the decorator pattern to intercept those dependencies.
 */
import { ConnectionsPage } from './ConnectionsPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ConnectionsPage>;
export default meta;
type Story = StoryObj<typeof ConnectionsPage>;
/**
 * Default state when no routerId is present in the URL params.
 * Shows the empty-state prompt asking the user to select a router.
 */
export declare const NoRouterSelected: Story;
/**
 * Page shell with a router ID present — shows the tabbed layout.
 * Data hooks are not mocked so the list and settings panels will
 * show their own loading/empty states.
 */
export declare const WithRouterSelected: Story;
/**
 * Renders with the Settings tab pre-selected to show the connection
 * tracking settings panel.
 */
export declare const SettingsTabActive: Story;
/**
 * Dark-mode variant — verifies semantic token usage renders correctly
 * on dark backgrounds.
 */
export declare const DarkMode: Story;
//# sourceMappingURL=ConnectionsPage.stories.d.ts.map