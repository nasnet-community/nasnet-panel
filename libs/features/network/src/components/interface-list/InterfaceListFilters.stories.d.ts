/**
 * InterfaceListFilters Stories
 *
 * Pure controlled filter bar — no GraphQL dependencies.
 * Provides dropdowns for interface type and status, plus a free-text search
 * input and a "Clear filters" button that appears when any filter is active.
 */
import { InterfaceListFilters } from './InterfaceListFilters';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceListFilters>;
export default meta;
type Story = StoryObj<typeof InterfaceListFilters>;
/** Default state — all filters cleared, no "Clear" button visible. */
export declare const Default: Story;
/** Type pre-selected to Ethernet. */
export declare const FilteredByType: Story;
/** Status pre-selected to Down — useful for spotting offline interfaces quickly. */
export declare const FilteredByStatus: Story;
/** Search term pre-populated — "Clear filters" button should be visible. */
export declare const WithSearchTerm: Story;
/** All three filters active simultaneously — "Clear filters" button visible. */
export declare const AllFiltersActive: Story;
/** Mobile viewport — filters should wrap gracefully on narrow screens. */
export declare const MobileView: Story;
//# sourceMappingURL=InterfaceListFilters.stories.d.ts.map