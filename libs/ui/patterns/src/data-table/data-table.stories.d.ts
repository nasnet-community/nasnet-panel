/**
 * DataTable Stories
 *
 * Storybook stories for the DataTable pattern component.
 * Demonstrates column definitions, data states, loading, empty, and clickable rows.
 */
import { DataTable } from './data-table';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DataTable>;
export default meta;
type Story = StoryObj<typeof DataTable>;
/**
 * Default table rendering network interfaces with custom cell renderers
 * including badge status and monospaced values.
 */
export declare const NetworkInterfaces: Story;
/**
 * DHCP lease table with conditional row highlighting via custom cell renderers.
 */
export declare const DHCPLeases: Story;
/**
 * Firewall rules table with action-coloured cells and chain badges.
 */
export declare const FirewallRules: Story;
/**
 * Loading state: a single full-width row with "Loading..." text.
 */
export declare const Loading: Story;
/**
 * Empty state rendered when data array has no items.
 */
export declare const Empty: Story;
/**
 * Clickable rows: each row acts as a navigation trigger.
 */
export declare const ClickableRows: Story;
//# sourceMappingURL=data-table.stories.d.ts.map