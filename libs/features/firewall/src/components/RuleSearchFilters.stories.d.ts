/**
 * RuleSearchFilters Storybook Stories
 *
 * Stories for the firewall rule search and filter panel component.
 * Demonstrates all filter combinations, active badge states, and responsive layout.
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * RuleSearchFilters - Multi-field filter panel for firewall rules
 *
 * Provides a complete search and filter interface for the firewall rule table.
 * Combines a debounced text search with four dropdown filters (chain, action,
 * protocol, status), shows active filter badges, and includes a "Clear all" button.
 *
 * ## Features
 *
 * - **Debounced search**: 300ms delay on text input to avoid excessive re-renders
 * - **Chain filter**: All / Input / Forward / Output / Prerouting / Postrouting
 * - **Action filter**: All / Accept / Drop / Reject / Log
 * - **Protocol filter**: All / TCP / UDP / ICMP
 * - **Status filter**: All / Enabled / Disabled
 * - **Active filter badges**: Removable badge for each non-default filter value
 * - **Clear all button**: Resets every filter to its default in one click
 * - **Active count badge**: Header badge showing the number of active filters
 * - **Mobile collapsible**: Dropdowns hidden behind a toggle on narrow viewports
 *
 * ## Props
 *
 * | Prop               | Type                               | Description                          |
 * |--------------------|-------------------------------------|--------------------------------------|
 * | `filters`          | `FirewallFilters`                  | Current filter state                 |
 * | `onChange`         | `(partial: FirewallFilters) => void` | Partial update callback              |
 * | `onClearAll`       | `() => void`                       | Reset all filters to defaults        |
 * | `activeFilterCount`| `number`                           | Badge count shown in header          |
 * | `className`        | `string?`                          | Additional CSS classes               |
 *
 * ## Usage
 *
 * ```tsx
 * const [filters, setFilters] = useState<FirewallFilters>({});
 *
 * const handleChange = (partial: Partial<FirewallFilters>) =>
 *   setFilters((prev) => ({ ...prev, ...partial }));
 *
 * const handleClearAll = () => setFilters({});
 *
 * const activeCount = Object.entries(filters).filter(
 *   ([, v]) => v && v !== 'all'
 * ).length;
 *
 * <RuleSearchFilters
 *   filters={filters}
 *   onChange={handleChange}
 *   onClearAll={handleClearAll}
 *   activeFilterCount={activeCount}
 * />
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./RuleSearchFilters").RuleSearchFiltersProps>;
    tags: string[];
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    argTypes: {
        activeFilterCount: {
            control: {
                type: "number";
                min: number;
                max: number;
            };
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
        onChange: {
            action: string;
            description: string;
        };
        onClearAll: {
            action: string;
            description: string;
        };
    };
    args: {
        onChange: import("storybook/test").Mock<(...args: any[]) => any>;
        onClearAll: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * All filters at their default values. The header shows no active-count badge.
 * Dropdowns display "All Chains", "All Actions", "All Protocols", "All Status".
 */
export declare const Default: Story;
/**
 * WithSearchTerm
 *
 * A search term pre-populated in the input. A removable badge "192.168.1.0"
 * appears below the filter controls.
 */
export declare const WithSearchTerm: Story;
/**
 * ChainFilterActive
 *
 * Chain filter set to "forward". The dropdown reflects the selection
 * and a "Chain: forward" badge appears below.
 */
export declare const ChainFilterActive: Story;
/**
 * ActionFilterActive
 *
 * Action filter set to "drop". Shows a "Action: drop" badge and the
 * select trigger reads "Drop".
 */
export declare const ActionFilterActive: Story;
/**
 * ProtocolFilterActive
 *
 * Protocol filter set to "tcp". Shows a "Protocol: tcp" badge.
 */
export declare const ProtocolFilterActive: Story;
/**
 * StatusFilterDisabled
 *
 * Status filter set to "disabled". Shows only disabled (inactive) firewall rules,
 * useful for auditing redundant configurations.
 */
export declare const StatusFilterDisabled: Story;
/**
 * MultipleFiltersActive
 *
 * Three filters active simultaneously: chain=input, action=drop, protocol=tcp.
 * All three badges are rendered and the header badge shows "3 active".
 */
export declare const MultipleFiltersActive: Story;
/**
 * AllFiltersActive
 *
 * Every possible filter has a non-default value, including a search term.
 * Demonstrates the maximum badge count (5) and verifies the "Clear all" button
 * placement and wrapping behavior.
 */
export declare const AllFiltersActive: Story;
/**
 * Interactive
 *
 * A fully wired stateful story that allows Storybook users to interact with
 * all filter controls and see badge state update in real time.
 */
export declare const Interactive: Story;
/**
 * MobileView
 *
 * Narrow viewport (mobile1). Dropdown filters are collapsed behind the
 * "Show Filters" toggle button; only the search input and toggle are visible.
 */
export declare const MobileView: Story;
/**
 * MobileWithActiveFilters
 *
 * Mobile viewport with two active filters. The toggle button badge shows "2"
 * even when filters are collapsed, alerting the user that filters are in effect.
 */
export declare const MobileWithActiveFilters: Story;
//# sourceMappingURL=RuleSearchFilters.stories.d.ts.map