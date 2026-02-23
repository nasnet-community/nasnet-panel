/**
 * LiveRegion Component Stories
 *
 * ARIA live region announcements for screen readers.
 * Demonstrates polite vs assertive modes and atomic vs non-atomic updates.
 *
 * @see WCAG 4.1.3: Status Messages
 */
import { LiveRegion } from './live-region';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LiveRegion>;
export default meta;
type Story = StoryObj<typeof LiveRegion>;
/**
 * Default polite announcement, hidden from visual display.
 */
export declare const DefaultPolite: Story;
/**
 * Assertive alert mode for urgent messages.
 */
export declare const AssertiveAlert: Story;
/**
 * Log mode for sequential messages (e.g., operation steps).
 */
export declare const LogMode: Story;
/**
 * Timer mode for countdown announcements.
 */
export declare const TimerMode: Story;
/**
 * Interactive demo using useAnnounce hook.
 */
export declare const InteractiveAnnounce: Story;
/**
 * Global announcer with AnnouncerProvider context.
 */
export declare const GlobalAnnouncer: Story;
/**
 * Visible announcement (e.g., error banner).
 */
export declare const VisibleErrorBanner: Story;
/**
 * Non-atomic (partial) announcements.
 */
export declare const NonAtomic: Story;
//# sourceMappingURL=live-region.stories.d.ts.map