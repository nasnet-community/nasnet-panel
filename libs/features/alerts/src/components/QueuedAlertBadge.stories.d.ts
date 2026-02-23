/**
 * QueuedAlertBadge Storybook Stories
 *
 * Demonstrates all visual states of the quiet-hours queuing badge:
 * - Queued alert (pending delivery after quiet hours)
 * - Bypassed alert (critical severity that overrode quiet hours)
 * - Invisible when no queuing data is present
 */
import { QueuedAlertBadge } from './QueuedAlertBadge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof QueuedAlertBadge>;
export default meta;
type Story = StoryObj<typeof QueuedAlertBadge>;
/**
 * Alert queued for delivery in 2 hours — typical overnight quiet-hours scenario.
 */
export declare const QueuedSoon: Story;
/**
 * Alert queued with a longer delay — delivers in 8 hours (e.g., overnight window).
 */
export declare const QueuedOvernight: Story;
/**
 * Alert queued for less than one hour — badge shows "soon" label.
 */
export declare const QueuedImminently: Story;
/**
 * Critical alert bypassed quiet hours — delivered immediately despite active window.
 */
export declare const BypassedQuietHours: Story;
/**
 * No queuing data — component renders nothing.
 */
export declare const NoQueueData: Story;
/**
 * Both props provided — shouldBypassQuietHours takes precedence.
 */
export declare const BothProps: Story;
//# sourceMappingURL=QueuedAlertBadge.stories.d.ts.map