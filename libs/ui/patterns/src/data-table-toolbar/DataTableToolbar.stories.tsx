/**
 * DataTableToolbar Stories
 *
 * Storybook stories for the DataTableToolbar pattern component.
 * Demonstrates layout compositions for search, filters, and action buttons.
 */

import { useState } from 'react';

import { Plus, Filter, Download, RefreshCw, Search, X } from 'lucide-react';

import { Button, Input, Badge } from '@nasnet/ui/primitives';

import { DataTableToolbar } from './DataTableToolbar';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DataTableToolbar> = {
  title: 'Patterns/DataDisplay/DataTableToolbar',
  component: DataTableToolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Toolbar container for DataTable controls.

Provides a consistent flex layout with \`role="toolbar"\` and \`aria-label="Table controls"\`
for accessibility. Typically placed directly above a \`DataTable\` component.

## Usage

\`\`\`tsx
import { DataTableToolbar } from '@nasnet/ui/patterns';

<DataTableToolbar>
  <div className="flex flex-1 items-center gap-2">
    <Input placeholder="Search..." />
  </div>
  <Button>Add Item</Button>
</DataTableToolbar>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    className: {
      description: 'Additional CSS classes for the toolbar wrapper',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTableToolbar>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Minimal toolbar with a single search input.
 */
export const SearchOnly: Story = {
  render: (args) => (
    <DataTableToolbar {...args}>
      <div className="flex flex-1 items-center gap-2">
        <Search className="text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search interfaces..."
          className="max-w-sm"
        />
      </div>
    </DataTableToolbar>
  ),
};

/**
 * Toolbar with search on the left and an "Add" action button on the right.
 */
export const SearchWithAction: Story = {
  render: (args) => (
    <DataTableToolbar {...args}>
      <div className="flex flex-1 items-center gap-2">
        <Search className="text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search leases..."
          className="max-w-sm"
        />
      </div>
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Lease
      </Button>
    </DataTableToolbar>
  ),
};

/**
 * Full-featured toolbar: search, filter chips, and multiple actions.
 */
export const FullFeatured: Story = {
  render: (args) => (
    <DataTableToolbar {...args}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search firewall rules..."
            className="max-w-xs pl-8"
          />
        </div>
        <Badge
          variant="secondary"
          className="hover:bg-destructive/10 cursor-pointer gap-1"
        >
          chain: input
          <X className="h-3 w-3" />
        </Badge>
        <Badge
          variant="secondary"
          className="hover:bg-destructive/10 cursor-pointer gap-1"
        >
          action: accept
          <X className="h-3 w-3" />
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>
    </DataTableToolbar>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Full toolbar with inline search, active filter chips (with remove), and multiple action buttons.',
      },
    },
  },
};

/**
 * Toolbar with a refresh button and a result count indicator.
 */
export const WithRefreshAndCount: Story = {
  render: (args) => {
    function RefreshExample() {
      const [loading, setLoading] = useState(false);

      const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1200);
      };

      return (
        <DataTableToolbar {...args}>
          <div className="flex flex-1 items-center gap-2">
            <Search className="text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              className="max-w-sm"
            />
            <span className="text-muted-foreground ml-1 text-sm">24 results</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </DataTableToolbar>
      );
    }

    return <RefreshExample />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Toolbar with an animated refresh button that shows loading state for 1.2 seconds.',
      },
    },
  },
};

/**
 * Read-only toolbar showing active filters only (no actions).
 */
export const ReadOnlyFiltersView: Story = {
  render: (args) => (
    <DataTableToolbar {...args}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Active filters:</span>
        <Badge variant="outline">Status: Online</Badge>
        <Badge variant="outline">Type: Ethernet</Badge>
        <Badge variant="outline">IP: 192.168.x.x</Badge>
      </div>
      <span className="text-muted-foreground text-sm">3 of 12 interfaces</span>
    </DataTableToolbar>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Read-only toolbar displaying active filter chips and a result count — useful for view-only dashboards.',
      },
    },
  },
};

/**
 * Custom className applied to the toolbar wrapper.
 */
export const WithCustomClassName: Story = {
  render: (args) => (
    <DataTableToolbar
      {...args}
      className="bg-primary/5 border-primary/20"
    >
      <div className="flex flex-1 items-center gap-2">
        <Search className="text-primary h-4 w-4" />
        <Input
          placeholder="Search..."
          className="border-primary/30 max-w-sm"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        New
      </Button>
    </DataTableToolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using `className` to apply a branded background tint and border.',
      },
    },
  },
};
