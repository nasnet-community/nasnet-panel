/**
 * Storybook stories for LeaseFilters
 *
 * Filter controls for the DHCP lease management page.
 * Provides status and server dropdowns with active-filter badge chips.
 *
 * NOTE: LeaseFilters reads from and writes to the useDHCPUIStore Zustand store.
 * Each story renders the component with the store in its default state.
 * Use the dropdowns interactively to see active-filter badges appear.
 */
import { LeaseFilters } from './LeaseFilters';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LeaseFilters>;
export default meta;
type Story = StoryObj<typeof LeaseFilters>;
/**
 * Default state — no active filters.
 * Both dropdowns show their "All" placeholder values.
 */
export declare const Default: Story;
/**
 * Multiple DHCP servers available in the dropdown.
 * Common on routers with separate LAN, Guest, and IoT networks.
 */
export declare const MultipleServers: Story;
/**
 * No DHCP servers configured yet.
 * The Server dropdown only shows "All Servers".
 */
export declare const NoServers: Story;
/**
 * Wide layout demonstrating the inline flex wrap behavior
 * when both filter controls and active badges are visible together.
 */
export declare const WideLayout: Story;
/**
 * Compact view embedded inside a card panel,
 * showing how the component adapts to constrained widths.
 */
export declare const CompactCard: Story;
//# sourceMappingURL=LeaseFilters.stories.d.ts.map