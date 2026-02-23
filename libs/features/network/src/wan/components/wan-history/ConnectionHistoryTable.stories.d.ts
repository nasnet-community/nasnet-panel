/**
 * Storybook stories for ConnectionHistoryTable.
 *
 * Covers: populated table, empty state, error state, loading state,
 * large dataset (pagination), and single-event view.
 */
import { ConnectionHistoryTable } from './ConnectionHistoryTable';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ConnectionHistoryTable>;
export default meta;
type Story = StoryObj<typeof ConnectionHistoryTable>;
export declare const Default: Story;
export declare const SmallPageSize: Story;
export declare const LargeDataset: Story;
export declare const Loading: Story;
export declare const Empty: Story;
export declare const WithError: Story;
export declare const ErrorWithCachedData: Story;
export declare const WithRefreshHandler: Story;
//# sourceMappingURL=ConnectionHistoryTable.stories.d.ts.map