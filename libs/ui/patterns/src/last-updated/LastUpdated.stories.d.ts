/**
 * LastUpdated Stories
 *
 * Storybook stories for the LastUpdated pattern component.
 * Demonstrates how the component renders relative timestamps
 * sourced from TanStack Query's `dataUpdatedAt` field.
 */
import { LastUpdated } from './LastUpdated';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LastUpdated>;
export default meta;
type Story = StoryObj<typeof LastUpdated>;
/**
 * Just now: timestamp is the current moment — renders "Updated just now".
 */
export declare const JustNow: Story;
/**
 * A few seconds ago: simulates data fetched 30 seconds before render.
 */
export declare const ThirtySecondsAgo: Story;
/**
 * Several minutes ago: simulates data fetched 5 minutes before render.
 */
export declare const FiveMinutesAgo: Story;
/**
 * Over an hour ago: simulates stale data.
 */
export declare const TwoHoursAgo: Story;
/**
 * No timestamp: component renders null — canvas will be empty.
 */
export declare const NoTimestamp: Story;
/**
 * Custom className: applies additional styling, e.g., different text colour.
 */
export declare const CustomClassName: Story;
/**
 * Live ticker: timestamp updates every 10 seconds to show the hook's auto-refresh.
 */
export declare const LiveTicker: Story;
//# sourceMappingURL=LastUpdated.stories.d.ts.map