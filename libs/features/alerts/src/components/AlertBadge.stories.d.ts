/**
 * AlertBadge Storybook Stories
 *
 * Demonstrates the header notification count badge with various alert counts
 * and states, using MockedProvider to simulate GraphQL data.
 */
import { AlertBadge } from './AlertBadge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertBadge>;
export default meta;
type Story = StoryObj<typeof AlertBadge>;
/**
 * Single unacknowledged alert — minimal count.
 */
export declare const SingleAlert: Story;
/**
 * Multiple alerts — typical operational state with several active alerts.
 */
export declare const MultipleAlerts: Story;
/**
 * High alert count — badge truncates to "99+" beyond 99 items.
 */
export declare const OverflowCount: Story;
/**
 * Zero alerts — badge renders nothing (null).
 * The story wrapper shows a placeholder to confirm it is invisible.
 */
export declare const ZeroAlerts: Story;
/**
 * Scoped to a specific device — filters the alert count by router ID.
 */
export declare const DeviceScoped: Story;
/**
 * Custom className — badge positioned inside a mock header icon.
 */
export declare const InsideHeaderIcon: Story;
//# sourceMappingURL=AlertBadge.stories.d.ts.map