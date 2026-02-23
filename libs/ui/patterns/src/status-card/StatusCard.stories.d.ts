/**
 * StatusCard Stories
 *
 * Storybook stories for the StatusCard pattern component.
 * Demonstrates all four status variants, metrics grid, subtitle,
 * clickable behaviour, and a dashboard layout example.
 */
import { StatusCard } from './StatusCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StatusCard>;
export default meta;
type Story = StoryObj<typeof StatusCard>;
/**
 * Healthy status — green check icon with pulse animation on the status dot.
 */
export declare const Healthy: Story;
/**
 * Warning status — amber triangle, no pulse animation.
 * Used when one or more interfaces are degraded but the network is still up.
 */
export declare const Warning: Story;
/**
 * Error status — red X-circle icon.
 * Used when the network is down or a critical failure has been detected.
 */
export declare const Error: Story;
/**
 * Loading status — spinning loader with muted colours.
 * Shown while initial data is being fetched from the router.
 */
export declare const Loading: Story;
/**
 * Without metrics — header only, no grid.
 */
export declare const WithoutMetrics: Story;
/**
 * Clickable card — adds hover elevation and cursor-pointer.
 * Useful when the card acts as a navigation target.
 */
export declare const Clickable: Story;
/**
 * All status states rendered together — useful for design review.
 */
export declare const AllStates: Story;
export declare const Mobile: Story;
export declare const Tablet: Story;
export declare const Desktop: Story;
//# sourceMappingURL=StatusCard.stories.d.ts.map