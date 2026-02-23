/**
 * TimezoneSelector Storybook Stories
 *
 * Showcases the searchable timezone picker used in quiet hours configuration.
 * Demonstrates pre-selected timezones, disabled state, and search interaction.
 */
import { TimezoneSelector } from './TimezoneSelector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TimezoneSelector>;
export default meta;
type Story = StoryObj<typeof TimezoneSelector>;
/**
 * Default — Eastern US timezone pre-selected.
 */
export declare const Default: Story;
/**
 * UTC-equivalent — UTC itself is not in the IANA list produced by
 * Intl.supportedValuesOf, so this story exercises the component with
 * a common European timezone.
 */
export declare const EuropeanTimezone: Story;
/**
 * Asia/Pacific timezone — verifies correct grouping under the Asia region.
 */
export declare const AsianTimezone: Story;
/**
 * Australian timezone.
 */
export declare const AustralianTimezone: Story;
/**
 * Disabled state — selector is rendered but not interactive.
 */
export declare const Disabled: Story;
/**
 * No pre-selection — shows the placeholder text.
 */
export declare const NoSelection: Story;
//# sourceMappingURL=TimezoneSelector.stories.d.ts.map