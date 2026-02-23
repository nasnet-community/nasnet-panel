import { CollapsibleSidebar } from './CollapsibleSidebar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CollapsibleSidebar>;
export default meta;
type Story = StoryObj<typeof CollapsibleSidebar>;
/**
 * Default state: sidebar is expanded
 * Shows full navigation labels and the collapse toggle button
 */
export declare const Expanded: Story;
/**
 * Collapsed state: sidebar is minimized to icon-only view
 * Labels are hidden and icons are centered
 */
export declare const Collapsed: Story;
/**
 * Toggle button positioned at middle of the sidebar
 * Useful for sidebars with significant vertical space
 */
export declare const ToggleAtMiddle: Story;
/**
 * Sidebar without toggle button
 * Useful when collapse/expand is controlled elsewhere (e.g., menu button in header)
 */
export declare const NoToggleButton: Story;
/**
 * Sidebar positioned on the right side of the screen
 * Common in RTL layouts and right-aligned application designs
 */
export declare const RightPosition: Story;
/**
 * Interactive story with local state wired to toggle, demonstrating the
 * pattern used in the app layer when connecting the Zustand sidebar store.
 * Also shows how CollapsibleSidebarProvider feeds context to children.
 *
 * Try:
 * - Click the toggle button on the sidebar edge
 * - Press Ctrl+B / Cmd+B to toggle via keyboard shortcut
 * - Observe how the navigation labels hide when collapsed
 */
export declare const Interactive: Story;
/**
 * Example with custom width values
 * Demonstrates how to configure non-standard sidebar dimensions
 */
export declare const CustomWidths: Story;
//# sourceMappingURL=CollapsibleSidebar.stories.d.ts.map