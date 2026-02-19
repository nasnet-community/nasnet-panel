/**
 * BulkActionsToolbar Storybook Stories
 *
 * Story: NAS-6.3 - DHCP Lease Management
 *
 * Toolbar rendered when one or more DHCP leases are selected.
 * Provides "Make All Static", "Delete Selected", and "Clear" actions.
 * Destructive actions require confirmation via ConfirmationDialog.
 * The toolbar is hidden when selectedCount === 0.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { BulkActionsToolbar } from './BulkActionsToolbar';

const meta = {
  title: 'Features/Network/DHCP/BulkActionsToolbar',
  component: BulkActionsToolbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toolbar displayed when one or more DHCP leases are selected in the lease table. Offers three bulk actions: "Make All Static" (converts dynamic leases to static assignments), "Delete Selected" (permanently removes leases), and "Clear" (deselects all). The two destructive actions trigger a ConfirmationDialog before execution. The toolbar is not rendered when selectedCount is 0.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedCount: {
      description: 'Number of currently selected leases (0 hides the toolbar)',
      control: { type: 'number', min: 0, max: 100 },
    },
    isLoading: {
      description: 'Disables all buttons while an async operation is in progress',
      control: 'boolean',
    },
    onMakeStatic: {
      description: 'Called after user confirms "Make All Static"',
      action: 'make-static',
    },
    onDelete: {
      description: 'Called after user confirms "Delete Selected"',
      action: 'delete',
    },
    onClear: {
      description: 'Called immediately when "Clear" is clicked',
      action: 'clear',
    },
    className: {
      description: 'Additional CSS classes for layout customisation',
      control: 'text',
    },
  },
  args: {
    onMakeStatic: fn(),
    onDelete: fn(),
    onClear: fn(),
  },
} satisfies Meta<typeof BulkActionsToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * Default — 5 leases selected. All three action buttons are visible.
 */
export const Default: Story = {
  args: {
    selectedCount: 5,
  },
};

/**
 * Single lease selected — label uses singular form "1 lease selected".
 */
export const SingleLease: Story = {
  args: {
    selectedCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When exactly one lease is selected the count label uses the singular "1 lease selected" and the confirmation dialogs use singular wording.',
      },
    },
  },
};

/**
 * Large selection — 50 leases selected (bulk fleet cleanup scenario).
 */
export const LargeSelection: Story = {
  args: {
    selectedCount: 50,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bulk operation across 50 leases. Verifies that the count label scales and confirmation dialogs use plural wording.',
      },
    },
  },
};

/**
 * Loading state — all buttons disabled while the mutation runs.
 */
export const Loading: Story = {
  args: {
    selectedCount: 5,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While an async operation (Make Static or Delete) is executing, all toolbar buttons are disabled to prevent duplicate submissions.',
      },
    },
  },
};

/**
 * Hidden state — selectedCount is 0, so the toolbar renders nothing.
 * The story wrapper shows a helper message so the canvas is not blank.
 */
export const HiddenWhenNoneSelected: Story = {
  args: {
    selectedCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When selectedCount is 0 the component returns null and the toolbar is completely removed from the DOM.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground italic">
          (Toolbar is hidden — select at least one lease to reveal it)
        </p>
        <Story />
      </div>
    ),
  ],
};

/**
 * Custom className — demonstrates layout integration with the parent table.
 */
export const WithCustomClassName: Story = {
  args: {
    selectedCount: 3,
    className: 'rounded-none border-x-0',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The className prop allows integrating the toolbar flush with a surrounding table border by removing horizontal rounded corners.',
      },
    },
  },
};
