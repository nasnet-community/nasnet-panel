import { ResponsiveShell } from './ResponsiveShell';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ResponsiveShell>;
export default meta;
type Story = StoryObj<typeof ResponsiveShell>;
export declare const DesktopLayout: Story;
export declare const DesktopCollapsedSidebar: Story;
export declare const TabletLayout: Story;
export declare const MobileLayout: Story;
export declare const MobileWithBanner: Story;
/**
 * Interactive story: sidebar collapse is controlled by local state.
 * Demonstrates wiring `sidebarCollapsed` + `onSidebarToggle` the same way
 * the app layer connects the Zustand sidebar store.
 */
export declare const InteractiveDesktop: Story;
export declare const WithBanner: Story;
/**
 * Error state: demonstrate layout when in error/degraded state
 * Shows disconnection banner and disabled controls
 */
export declare const ErrorState: Story;
/**
 * Loading state: demonstrate skeleton/loading layout
 * Shows placeholder content while data is loading
 */
export declare const LoadingState: Story;
/**
 * Empty state: demonstrate layout with no content
 * Shows helpful message when there's nothing to display
 */
export declare const EmptyState: Story;
//# sourceMappingURL=ResponsiveShell.stories.d.ts.map