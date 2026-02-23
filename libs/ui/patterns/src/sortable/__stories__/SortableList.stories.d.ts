/**
 * SortableList Stories
 *
 * Storybook documentation for the drag & drop sortable list system.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import { SortableList } from '../index';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SortableList>;
export default meta;
type Story = StoryObj<typeof SortableList>;
/**
 * Basic sortable list with drag and drop.
 */
export declare const Basic: Story;
/**
 * List with position numbers displayed.
 */
export declare const WithPositionNumbers: Story;
/**
 * Desktop-optimized list with context menu.
 */
export declare const Desktop: Story;
/**
 * Mobile-optimized list with move buttons.
 */
export declare const Mobile: Story;
/**
 * Multi-select drag example.
 */
export declare const MultiSelect: Story;
/**
 * Firewall rules domain implementation.
 */
export declare const FirewallRules: Story;
/**
 * Empty state display.
 */
export declare const EmptyState: Story;
/**
 * Interactive playground for testing all features.
 */
export declare const Playground: Story;
/**
 * Hook-based example with undo/redo.
 */
export declare const WithUndoRedo: Story;
//# sourceMappingURL=SortableList.stories.d.ts.map