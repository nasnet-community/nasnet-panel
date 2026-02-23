/**
 * Router Status Storybook Stories
 *
 * Comprehensive stories for the Router Status component.
 * Demonstrates all states, platform variants, and accessibility features.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */
import type { Meta, StoryObj } from '@storybook/react';
import { RouterStatus } from './router-status';
declare const meta: Meta<typeof RouterStatus>;
export default meta;
type Story = StoryObj<typeof RouterStatus>;
/**
 * Connected state showing full details
 */
export declare const Connected: Story;
/**
 * Disconnected state with last seen timestamp
 */
export declare const Disconnected: Story;
/**
 * Reconnecting state with attempt counter
 */
export declare const Reconnecting: Story;
/**
 * Error state with retry button
 */
export declare const ErrorState: Story;
/**
 * Mobile compact badge view
 */
export declare const MobileCompact: Story;
/**
 * Mobile disconnected badge
 */
export declare const MobileDisconnected: Story;
/**
 * Mobile reconnecting badge
 */
export declare const MobileReconnecting: Story;
/**
 * Dark mode variant (desktop)
 */
export declare const DarkMode: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Status Indicator sizes
 */
export declare const StatusIndicatorSizes: Story;
/**
 * Status Indicator all states
 */
export declare const StatusIndicatorStates: Story;
/**
 * Interactive demo with status changes
 */
export declare const Interactive: Story;
/**
 * Accessibility demo with visible ARIA announcements
 */
export declare const Accessibility: Story;
//# sourceMappingURL=router-status.stories.d.ts.map