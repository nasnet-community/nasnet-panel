/**
 * TemplateFilters Storybook Stories
 *
 * Comprehensive documentation for the TemplateFilters component.
 * TemplateFilters is a pure controlled UI component — all stories use
 * React.useState via a wrapper to demonstrate interactive behaviour.
 */

import * as React from 'react';


import { TemplateFilters } from './TemplateFilters';

import type { TemplateBrowserFilters } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Default filter values (mirrors the exported constant)
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS: TemplateBrowserFilters = {
  searchQuery: '',
  category: null,
  scope: null,
  showBuiltIn: true,
  showCustom: true,
  sortBy: 'name',
};

// ---------------------------------------------------------------------------
// Interactive wrapper so every story is stateful
// ---------------------------------------------------------------------------

function FiltersWrapper({
  initialFilters = DEFAULT_FILTERS,
}: {
  initialFilters?: TemplateBrowserFilters;
}) {
  const [filters, setFilters] = React.useState<TemplateBrowserFilters>(initialFilters);

  const updateFilters = React.useCallback(
    (partial: Partial<TemplateBrowserFilters>) =>
      setFilters((prev) => ({ ...prev, ...partial })),
    []
  );

  const resetFilters = React.useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.category !== null ||
    filters.scope !== null ||
    !filters.showBuiltIn ||
    !filters.showCustom ||
    filters.sortBy !== 'name';

  return (
    <div className="w-72 border border-border rounded-lg p-4 bg-background">
      <TemplateFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />
      {/* Debug panel */}
      <details className="mt-6">
        <summary className="text-xs text-muted-foreground cursor-pointer select-none">
          Current filter state (debug)
        </summary>
        <pre className="text-xs mt-2 overflow-auto bg-muted p-2 rounded">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TemplateFilters> = {
  title: 'Features/Services/Templates/TemplateFilters',
  component: TemplateFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Filter controls for the templates browser sidebar (desktop) and bottom-sheet (mobile).

**Controls:**
- **Search** — free-text search with clear button
- **Category** — Privacy, Anti-Censorship, Messaging, Gaming, Security, Networking
- **Scope** — Single, Multiple, Chain
- **Sort By** — Name, Last Updated, Category, Service Count
- **Built-in / Custom toggles** — include/exclude each source type
- **Reset** — clears all filters (shown only when at least one is active)

The component is fully controlled; the parent provides \`filters\`, \`onFiltersChange\`,
and \`onReset\`.
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateFilters>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default state — no active filters, Reset button hidden.
 */
export const Default: Story = {
  render: () => <FiltersWrapper />,
};

/**
 * Pre-populated search query — clear button (×) is visible inside the input.
 */
export const WithSearchQuery: Story = {
  render: () => (
    <FiltersWrapper
      initialFilters={{ ...DEFAULT_FILTERS, searchQuery: 'privacy' }}
    />
  ),
};

/**
 * Category filter selected — "Privacy" is pre-selected in the dropdown.
 */
export const CategorySelected: Story = {
  render: () => (
    <FiltersWrapper
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialFilters={{ ...DEFAULT_FILTERS, category: 'PRIVACY' as any }}
    />
  ),
};

/**
 * Multiple active filters — Reset button is visible.
 */
export const MultipleActiveFilters: Story = {
  render: () => (
    <FiltersWrapper
      initialFilters={{
        searchQuery: 'vpn',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: 'SECURITY' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scope: 'CHAIN' as any,
        showBuiltIn: true,
        showCustom: false,
        sortBy: 'updated',
      }}
    />
  ),
};

/**
 * Custom-only mode — Built-in toggle disabled, Custom toggle on.
 */
export const CustomOnly: Story = {
  render: () => (
    <FiltersWrapper
      initialFilters={{ ...DEFAULT_FILTERS, showBuiltIn: false, showCustom: true }}
    />
  ),
};

/**
 * Sorted by "Last Updated" — useful default for update-monitoring workflows.
 */
export const SortedByUpdated: Story = {
  render: () => (
    <FiltersWrapper
      initialFilters={{ ...DEFAULT_FILTERS, sortBy: 'updated' }}
    />
  ),
};
