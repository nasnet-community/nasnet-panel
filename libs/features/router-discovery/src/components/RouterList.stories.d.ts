import { RouterList } from './RouterList';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RouterList>;
export default meta;
type Story = StoryObj<typeof RouterList>;
/**
 * Mixed fleet — online, offline, unknown, and connecting routers.
 * Sorted with online first.
 */
export declare const Default: Story;
/**
 * One router pre-selected — highlighted with blue border.
 */
export declare const WithSelection: Story;
/**
 * Single router — verifies header pluralisation ("1 Router") and no status
 * summary pills when only one type is present.
 */
export declare const SingleRouter: Story;
/**
 * All-online fleet — only green status pills shown in the summary.
 */
export declare const AllOnline: Story;
/**
 * Empty list with default empty state — shown when no routers have been
 * discovered or added yet.
 */
export declare const Empty: Story;
/**
 * Empty list with a custom empty state component.
 */
export declare const EmptyCustomState: Story;
//# sourceMappingURL=RouterList.stories.d.ts.map