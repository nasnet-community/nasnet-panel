import { AppShell } from './app-shell';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * AppShell Component Stories
 *
 * Pattern component for main application layout with header, sidebar, and footer.
 *
 * Platform support:
 * - Desktop (>1024px): Sidebar visible, fixed layout
 * - Tablet (640-1024px): Sidebar hidden, full-width content
 * - Mobile (<640px): Sidebar hidden, full-width content (use BottomNavigation instead)
 *
 * @see https://Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
declare const meta: Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof AppShell>;
/**
 * Default Desktop Layout
 * Shows the full desktop layout with header, left sidebar, and main content area.
 */
export declare const Default: Story;
/**
 * Desktop Layout with Footer
 * Demonstrates sticky footer at bottom of page.
 */
export declare const WithFooter: Story;
/**
 * Collapsed Sidebar State
 * Shows sidebar in collapsed mode (w-16), commonly used when user toggles collapse.
 */
export declare const CollapsedSidebar: Story;
/**
 * Right-Positioned Sidebar
 * Sidebar on the right side instead of left.
 */
export declare const RightSidebar: Story;
/**
 * With Status Banner
 * Shows optional banner area (for offline, alerts, etc.) between header and content.
 */
export declare const WithBanner: Story;
/**
 * No Sidebar (Full Width)
 * Desktop layout without sidebar - full width content area.
 */
export declare const NoSidebar: Story;
/**
 * Mobile Viewport
 * Shows how layout responds on mobile devices (<640px).
 * Sidebar is hidden with `hidden md:block` CSS class.
 */
export declare const Mobile: Story;
/**
 * Tablet Viewport
 * Shows how layout responds on tablets (640-1024px).
 * Sidebar is hidden but could be collapsible with drawer pattern.
 */
export declare const Tablet: Story;
//# sourceMappingURL=app-shell.stories.d.ts.map