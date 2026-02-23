/**
 * TemplateFilters Storybook Stories
 *
 * Comprehensive documentation for the TemplateFilters component.
 * TemplateFilters is a pure controlled UI component — all stories use
 * React.useState via a wrapper to demonstrate interactive behaviour.
 */
import { TemplateFilters } from './TemplateFilters';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TemplateFilters>;
export default meta;
type Story = StoryObj<typeof TemplateFilters>;
/**
 * Default state — no active filters, Reset button hidden.
 */
export declare const Default: Story;
/**
 * Pre-populated search query — clear button (×) is visible inside the input.
 */
export declare const WithSearchQuery: Story;
/**
 * Category filter selected — "Privacy" is pre-selected in the dropdown.
 */
export declare const CategorySelected: Story;
/**
 * Multiple active filters — Reset button is visible.
 */
export declare const MultipleActiveFilters: Story;
/**
 * Custom-only mode — Built-in toggle disabled, Custom toggle on.
 */
export declare const CustomOnly: Story;
/**
 * Sorted by "Last Updated" — useful default for update-monitoring workflows.
 */
export declare const SortedByUpdated: Story;
//# sourceMappingURL=TemplateFilters.stories.d.ts.map