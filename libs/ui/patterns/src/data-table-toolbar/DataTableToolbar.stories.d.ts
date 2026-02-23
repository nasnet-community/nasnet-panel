/**
 * DataTableToolbar Stories
 *
 * Storybook stories for the DataTableToolbar pattern component.
 * Demonstrates layout compositions for search, filters, and action buttons.
 */
import { DataTableToolbar } from './DataTableToolbar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DataTableToolbar>;
export default meta;
type Story = StoryObj<typeof DataTableToolbar>;
/**
 * Minimal toolbar with a single search input.
 */
export declare const SearchOnly: Story;
/**
 * Toolbar with search on the left and an "Add" action button on the right.
 */
export declare const SearchWithAction: Story;
/**
 * Full-featured toolbar: search, filter chips, and multiple actions.
 */
export declare const FullFeatured: Story;
/**
 * Toolbar with a refresh button and a result count indicator.
 */
export declare const WithRefreshAndCount: Story;
/**
 * Read-only toolbar showing active filters only (no actions).
 */
export declare const ReadOnlyFiltersView: Story;
/**
 * Custom className applied to the toolbar wrapper.
 */
export declare const WithCustomClassName: Story;
//# sourceMappingURL=DataTableToolbar.stories.d.ts.map