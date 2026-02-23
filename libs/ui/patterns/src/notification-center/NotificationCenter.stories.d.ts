/**
 * NotificationCenter Storybook Stories
 *
 * Interactive stories demonstrating notification center functionality.
 */
import { NotificationCenter } from './NotificationCenter';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NotificationCenter>;
export default meta;
type Story = StoryObj<typeof NotificationCenter>;
/**
 * Default story with 10 notifications
 */
export declare const Default: Story;
/**
 * Empty state (no notifications)
 */
export declare const Empty: Story;
/**
 * Large list (100+ notifications) to test scrolling and performance
 */
export declare const LargeList: Story;
/**
 * Only critical notifications
 */
export declare const OnlyCritical: Story;
/**
 * Mixed read/unread state
 */
export declare const MixedReadState: Story;
//# sourceMappingURL=NotificationCenter.stories.d.ts.map