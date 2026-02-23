import type { Meta, StoryObj } from '@storybook/react';
/**
 * VirtualizedTable combines TanStack Table with TanStack Virtual for
 * high-performance data tables. It supports sorting, filtering, selection,
 * and row virtualization.
 *
 * Key Features:
 * - Row virtualization for 1000+ rows
 * - Integrated sorting with <100ms response
 * - Row selection with keyboard support
 * - Sticky header during scroll
 * - Configurable row heights
 *
 * Performance Targets:
 * - Sort 1000 rows in <100ms
 * - Maintain 60fps scroll
 * - Memory efficient rendering
 */
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Firewall rules table with 1000 rows. Try sorting by clicking column headers.
 */
export declare const FirewallRules: Story;
/**
 * DHCP leases table with row selection support.
 */
export declare const DHCPLeases: Story;
/**
 * Large dataset with 10,000 rows to test performance limits.
 */
export declare const LargeDataset: Story;
/**
 * Compact row size for dense data display.
 */
export declare const CompactRows: Story;
/**
 * Comfortable row size for better readability.
 */
export declare const ComfortableRows: Story;
/**
 * Interactive example with live filtering.
 */
export declare const WithFiltering: Story;
/**
 * Small dataset that renders normally without virtualization.
 */
export declare const SmallDataset: Story;
/**
 * Empty state when no data is available.
 */
export declare const EmptyState: Story;
/**
 * Loading state while fetching data.
 */
export declare const LoadingState: Story;
//# sourceMappingURL=VirtualizedTable.stories.d.ts.map