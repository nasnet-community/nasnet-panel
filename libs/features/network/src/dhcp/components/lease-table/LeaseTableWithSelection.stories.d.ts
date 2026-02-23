/**
 * Storybook stories for LeaseTableWithSelection
 *
 * Desktop table for DHCP leases with sortable columns, bulk checkbox
 * selection, inline search, and expandable row detail panels.
 */
import { LeaseTableWithSelection } from './LeaseTableWithSelection';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LeaseTableWithSelection>;
export default meta;
type Story = StoryObj<typeof LeaseTableWithSelection>;
/**
 * Default populated table with 5 leases.
 * All interactions (sort, select, expand) work interactively.
 */
export declare const Default: Story;
/**
 * Table with the first two leases highlighted as "New".
 * They show a pulsing background and a gold sparkle badge.
 */
export declare const WithNewLeases: Story;
/**
 * Skeleton loading state shown while leases are being fetched.
 */
export declare const Loading: Story;
/**
 * Empty state when the router has no DHCP leases.
 */
export declare const Empty: Story;
/**
 * Table with a large set of pre-selected rows to demonstrate
 * the indeterminate and full-selection checkbox states.
 */
export declare const WithPreselectedRows: Story;
//# sourceMappingURL=LeaseTableWithSelection.stories.d.ts.map