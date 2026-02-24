/**
 * Port Knock Log Viewer Stories
 * Displays port knock attempt log with filtering and pagination
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */
import { PortKnockLogViewer } from './PortKnockLogViewer';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortKnockLogViewer>;
export default meta;
type Story = StoryObj<typeof PortKnockLogViewer>;
/**
 * Default state with knock attempts
 */
export declare const Default: Story;
/**
 * Empty state - No knock attempts
 */
export declare const Empty: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Filtered by status (Success only)
 */
export declare const FilteredBySuccess: Story;
/**
 * Filtered by IP address
 */
export declare const FilteredByIP: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
//# sourceMappingURL=PortKnockLogViewer.stories.d.ts.map