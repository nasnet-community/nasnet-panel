/**
 * Storybook stories for NetworkActionButtons
 * Quick-action toolbar for common network operations.
 */

import { Download, RefreshCw, Settings, Stethoscope, Trash2 } from 'lucide-react';

import {
  NetworkActionButtons,
  makeRefreshAction,
  makeDiagnosticsAction,
  makeSettingsAction,
  makeExportAction,
  type NetworkAction,
} from './NetworkActionButtons';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared no-op handler
// ---------------------------------------------------------------------------

const noop = () => undefined;

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkActionButtons> = {
  title: 'App/Network/NetworkActionButtons',
  component: NetworkActionButtons,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible toolbar of quick-action buttons for network dashboard pages. ' +
          'Accepts an array of `NetworkAction` descriptors and renders each as an accessible button ' +
          'with a Lucide icon, an optional label (hidden in `compact` mode), and full ' +
          'loading/disabled state support. ' +
          'Buttons meet the 44px minimum touch target requirement for mobile usage.',
      },
    },
  },
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'When true, only icons are shown — labels are hidden.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkActionButtons>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (3 actions)',
  args: {
    compact: false,
    actions: [
      makeRefreshAction(noop),
      makeDiagnosticsAction(noop),
      makeSettingsAction(noop),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical network page toolbar with Refresh, Diagnostics, and Settings actions. ' +
          'All buttons are enabled and in their idle state.',
      },
    },
  },
};

export const WithExport: Story = {
  name: 'With Export Action',
  args: {
    compact: false,
    actions: [
      makeRefreshAction(noop),
      makeDiagnosticsAction(noop),
      makeExportAction(noop),
      makeSettingsAction(noop),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Adds a fourth Export button. Useful on pages where interface configs can be downloaded.',
      },
    },
  },
};

export const RefreshLoading: Story = {
  name: 'Refresh in Loading State',
  args: {
    compact: false,
    actions: [
      makeRefreshAction(noop, true), // isLoading = true → icon spins
      makeDiagnosticsAction(noop),
      makeSettingsAction(noop),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'The Refresh button\'s icon animates with `animate-spin` while `isLoading` is true. ' +
          'The button is also disabled during this state to prevent duplicate requests.',
      },
    },
  },
};

export const WithDestructiveAction: Story = {
  name: 'With Destructive Action',
  args: {
    compact: false,
    actions: [
      makeRefreshAction(noop),
      {
        id: 'flush-arp',
        label: 'Flush ARP',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: noop,
        variant: 'destructive',
      } satisfies NetworkAction,
      makeSettingsAction(noop),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates a destructive variant — rendered with a red colour scheme — ' +
          'suitable for actions like flushing the ARP cache or resetting counters.',
      },
    },
  },
};

export const Compact: Story = {
  name: 'Compact (icon-only)',
  args: {
    compact: true,
    actions: [
      makeRefreshAction(noop),
      makeDiagnosticsAction(noop),
      makeSettingsAction(noop),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'In compact mode button labels are hidden and only the icon is visible. ' +
          'Each button still carries an `aria-label` for screen readers and retains the 44px touch target. ' +
          'Use this variant in narrow headers or mobile toolbars.',
      },
    },
  },
};

export const AllDisabled: Story = {
  name: 'All Disabled',
  args: {
    compact: false,
    actions: [
      { ...makeRefreshAction(noop), disabled: true },
      { ...makeDiagnosticsAction(noop), disabled: true },
      { ...makeSettingsAction(noop), disabled: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'All buttons are disabled — e.g. while the router is offline and no actions can be taken.',
      },
    },
  },
};

export const CustomActions: Story = {
  name: 'Custom Actions',
  args: {
    compact: false,
    actions: [
      {
        id: 'ping',
        label: 'Ping Test',
        icon: <Stethoscope className="w-4 h-4" />,
        onClick: noop,
      },
      {
        id: 'export-csv',
        label: 'Export CSV',
        icon: <Download className="w-4 h-4" />,
        onClick: noop,
        variant: 'outline',
      },
      {
        id: 'refresh-custom',
        label: 'Sync Now',
        icon: <RefreshCw className="w-4 h-4" />,
        onClick: noop,
        isLoading: false,
      },
    ] satisfies NetworkAction[],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Completely custom action descriptors passed directly as objects, bypassing the factory helpers. ' +
          'Shows the flexibility of the `actions` prop.',
      },
    },
  },
};
