/**
 * InterfaceListFilters Stories
 *
 * Pure controlled filter bar — no GraphQL dependencies.
 * Provides dropdowns for interface type and status, plus a free-text search
 * input and a "Clear filters" button that appears when any filter is active.
 */

import { useState } from 'react';


import { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';

import { InterfaceListFilters } from './InterfaceListFilters';

import type { InterfaceFilters } from './InterfaceList';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceListFilters> = {
  title: 'Features/Network/InterfaceListFilters',
  component: InterfaceListFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Filter bar for the interface list. Provides selects for Type and Status and a text search field. The "Clear filters" button appears whenever at least one filter is active. All state is controlled by the parent via `filters` and `onChange`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceListFilters>;

// ---------------------------------------------------------------------------
// Stateful wrapper — required because the component is fully controlled
// ---------------------------------------------------------------------------

function StatefulFilters({ initialFilters }: { initialFilters: InterfaceFilters }) {
  const [filters, setFilters] = useState<InterfaceFilters>(initialFilters);
  return (
    <div className="p-4 bg-background">
      <InterfaceListFilters filters={filters} onChange={setFilters} />
      <pre className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Default state — all filters cleared, no "Clear" button visible. */
export const Default: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{ type: null, status: null, search: '' }}
    />
  ),
};

/** Type pre-selected to Ethernet. */
export const FilteredByType: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{ type: InterfaceType.Ethernet, status: null, search: '' }}
    />
  ),
};

/** Status pre-selected to Down — useful for spotting offline interfaces quickly. */
export const FilteredByStatus: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{ type: null, status: InterfaceStatus.Down, search: '' }}
    />
  ),
};

/** Search term pre-populated — "Clear filters" button should be visible. */
export const WithSearchTerm: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{ type: null, status: null, search: 'ether' }}
    />
  ),
};

/** All three filters active simultaneously — "Clear filters" button visible. */
export const AllFiltersActive: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{
        type: InterfaceType.Bridge,
        status: InterfaceStatus.Up,
        search: 'bridge',
      }}
    />
  ),
};

/** Mobile viewport — filters should wrap gracefully on narrow screens. */
export const MobileView: Story = {
  render: () => (
    <StatefulFilters
      initialFilters={{ type: null, status: null, search: '' }}
    />
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'On narrow screens the filter chips wrap to multiple lines.',
      },
    },
  },
};
