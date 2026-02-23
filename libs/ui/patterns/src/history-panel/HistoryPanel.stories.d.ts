/**
 * History Panel Storybook Stories
 *
 * Demonstrates the history panel components with sample data.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
import { HistoryPanel } from './HistoryPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof HistoryPanel>;
export default meta;
type Story = StoryObj<typeof HistoryPanel>;
/**
 * Default history panel with sample actions
 */
export declare const Default: Story;
/**
 * Empty state when no history
 */
export declare const Empty: Story;
/**
 * Desktop variant (forced)
 */
export declare const Desktop: Story;
/**
 * Mobile variant (forced)
 */
export declare const Mobile: Story;
/**
 * With many actions (scrolling)
 */
export declare const ManyActions: Story;
/**
 * Keyboard navigation demo
 */
export declare const KeyboardNavigation: Story;
//# sourceMappingURL=HistoryPanel.stories.d.ts.map