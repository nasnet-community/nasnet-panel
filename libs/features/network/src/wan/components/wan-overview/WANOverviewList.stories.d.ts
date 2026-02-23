/**
 * Storybook stories for WANOverviewList.
 *
 * Covers: multi-WAN grid, single WAN, empty state, loading state,
 * error state, and error banner with cached data.
 */
import { WANOverviewList } from './WANOverviewList';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WANOverviewList>;
export default meta;
type Story = StoryObj<typeof WANOverviewList>;
export declare const Default: Story;
export declare const AllConnected: Story;
export declare const WithConnecting: Story;
export declare const SingleWAN: Story;
export declare const WithActions: Story;
export declare const Loading: Story;
export declare const Empty: Story;
export declare const ErrorNoData: Story;
export declare const ErrorWithCachedData: Story;
//# sourceMappingURL=WANOverviewList.stories.d.ts.map