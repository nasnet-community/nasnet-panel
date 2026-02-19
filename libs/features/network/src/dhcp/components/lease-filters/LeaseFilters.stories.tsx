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

import * as React from 'react';

import { LeaseFilters } from './LeaseFilters';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof LeaseFilters> = {
  title: 'Features/Network/DHCP/LeaseFilters',
  component: LeaseFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Filter toolbar for the DHCP lease table. Provides a Status dropdown ' +
          '(All, Bound, Waiting, Busy, Offered, Static) and a Server dropdown ' +
          'populated from available DHCP servers. Active filters are shown as ' +
          'dismissible badge chips below the controls. Integrates with the ' +
          'useDHCPUIStore Zustand store for state persistence.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LeaseFilters>;

// ─── Shared mock servers ──────────────────────────────────────────────────────

const singleServer = [{ id: 'dhcp1', name: 'dhcp1 (LAN)' }];

const multipleServers = [
  { id: 'dhcp1', name: 'dhcp1 (LAN)' },
  { id: 'dhcp2', name: 'dhcp2 (Guest)' },
  { id: 'dhcp3', name: 'dhcp3 (IoT)' },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default state — no active filters.
 * Both dropdowns show their "All" placeholder values.
 */
export const Default: Story = {
  args: {
    servers: singleServer,
  },
};

/**
 * Multiple DHCP servers available in the dropdown.
 * Common on routers with separate LAN, Guest, and IoT networks.
 */
export const MultipleServers: Story = {
  args: {
    servers: multipleServers,
  },
};

/**
 * No DHCP servers configured yet.
 * The Server dropdown only shows "All Servers".
 */
export const NoServers: Story = {
  args: {
    servers: [],
  },
};

/**
 * Wide layout demonstrating the inline flex wrap behavior
 * when both filter controls and active badges are visible together.
 */
export const WideLayout: Story = {
  args: {
    servers: multipleServers,
  },
  decorators: [
    (Story) => (
      <div className="p-6 w-full max-w-4xl border rounded-lg bg-card">
        <h3 className="text-sm font-semibold mb-4 text-foreground">
          DHCP Lease Filters
        </h3>
        <Story />
      </div>
    ),
  ],
};

/**
 * Compact view embedded inside a card panel,
 * showing how the component adapts to constrained widths.
 */
export const CompactCard: Story = {
  args: {
    servers: singleServer,
    className: 'gap-2',
  },
  decorators: [
    (Story) => (
      <div className="p-4 w-80 border rounded-lg bg-card shadow-sm">
        <Story />
      </div>
    ),
  ],
};
