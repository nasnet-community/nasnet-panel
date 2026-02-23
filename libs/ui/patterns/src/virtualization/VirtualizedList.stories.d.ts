import type { Meta, StoryObj } from '@storybook/react';
/**
 * VirtualizedList provides high-performance rendering for large lists.
 * It only renders visible items plus a configurable overscan buffer,
 * making it suitable for lists with 1000+ items.
 *
 * Key Features:
 * - Automatic virtualization for lists >20 items
 * - Variable height item support
 * - Keyboard navigation (arrow keys)
 * - Scroll position restoration
 * - ARIA compliant for accessibility
 *
 * Performance Targets:
 * - 60fps scroll performance
 * - <16ms render budget per frame
 * - Memory efficient (only renders visible items)
 */
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Basic usage with 1000 items. Notice how only visible items are rendered.
 */
export declare const Default: Story;
/**
 * Large dataset with 10,000 items demonstrating performance at scale.
 */
export declare const LargeDataset: Story;
/**
 * Card-style items with variable heights.
 */
export declare const CardItems: Story;
/**
 * Demonstrates keyboard navigation. Use arrow keys to navigate, Enter to select.
 */
export declare const WithKeyboardNavigation: Story;
/**
 * Interactive example with filtering to show re-render performance.
 */
export declare const WithFiltering: Story;
/**
 * Small list that does not require virtualization (below threshold).
 */
export declare const SmallList: Story;
/**
 * Force virtualization even for small lists (useful for consistent behavior).
 */
export declare const ForceVirtualization: Story;
/**
 * Custom overscan to reduce/increase buffer items.
 */
export declare const CustomOverscan: Story;
//# sourceMappingURL=VirtualizedList.stories.d.ts.map