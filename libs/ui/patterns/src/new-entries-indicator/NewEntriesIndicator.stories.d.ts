/**
 * NewEntriesIndicator Stories
 *
 * Storybook stories for the NewEntriesIndicator pattern component.
 * This floating button appears when the user is scrolled up while new
 * log entries arrive, prompting them to scroll to the latest entries.
 */
import { NewEntriesIndicator } from './NewEntriesIndicator';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NewEntriesIndicator>;
export default meta;
type Story = StoryObj<typeof NewEntriesIndicator>;
/**
 * Default state: one new entry (singular label).
 */
export declare const SingleEntry: Story;
/**
 * Multiple new entries: plural label "5 new entries".
 */
export declare const MultipleEntries: Story;
/**
 * High-volume case: 99 new entries, e.g., a burst of log activity.
 */
export declare const HighVolumeEntries: Story;
/**
 * Zero count: component renders nothing — useful to verify null output.
 */
export declare const ZeroCount: Story;
/**
 * Interactive: click the button and the count resets to 0, hiding the indicator.
 */
export declare const Interactive: Story;
//# sourceMappingURL=NewEntriesIndicator.stories.d.ts.map