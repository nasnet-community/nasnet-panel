/**
 * Storybook stories for TopicFilter
 *
 * Multi-select popover for filtering logs by RouterOS topic/facility.
 * WCAG AAA compliant with ARIA listbox + option roles and 44px touch targets.
 * Story NAS-5.6: Recent Logs with Filtering.
 */
import { TopicFilter } from './TopicFilter';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TopicFilter>;
export default meta;
type Story = StoryObj<typeof TopicFilter>;
/** No topics selected — the trigger shows only the filter icon with no badge. */
export declare const NoFilters: Story;
/** Single topic active — badge shows count of 1. */
export declare const SingleTopicSelected: Story;
/** Multiple topics active — badge shows count, "Clear filters" button visible. */
export declare const MultipleTopicsSelected: Story;
/** All available filter topics selected — badge shows maximum count. */
export declare const AllTopicsSelected: Story;
/** Network-related topics — DNS, route, interface, and VPN pre-selected. */
export declare const NetworkTopics: Story;
//# sourceMappingURL=TopicFilter.stories.d.ts.map