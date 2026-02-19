/**
 * EmptyState Stories
 *
 * Storybook stories for the EmptyState pattern component.
 * Demonstrates different icon, action, and content variants used
 * throughout the app when lists or pages have no data to show.
 */

import {
  Shield,
  Wifi,
  Server,
  FileText,
  Bell,
  Search,
  Database,
} from 'lucide-react';

import { EmptyState } from './EmptyState';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof EmptyState> = {
  title: 'Patterns/PageStructure/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Consistent empty state pattern used across all pages when there is no data to display.

Follows **Design Direction 1: Clean Minimal** from the UX specification:
- Large icon in a rounded square muted background
- Clear heading and descriptive subtitle
- Optional call-to-action button (supports \`action\`, \`default\`, and \`outline\` variants)
- Proper spacing, alignment, and \`role="status"\` for accessibility

## Usage

\`\`\`tsx
import { EmptyState } from '@nasnet/ui/patterns';

<EmptyState
  icon={Shield}
  title="No WireGuard interfaces configured"
  description="Your router doesn't have any WireGuard VPN interfaces set up yet."
  action={{
    label: 'Add VPN',
    onClick: () => navigate('/vpn/add'),
    variant: 'action',
  }}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    icon: {
      description: 'Lucide icon component to display',
      control: false,
    },
    title: {
      description: 'Main heading text',
      control: 'text',
    },
    description: {
      description: 'Descriptive subtitle text',
      control: 'text',
    },
    action: {
      description: 'Optional CTA button configuration',
      control: 'object',
    },
    className: {
      description: 'Additional CSS classes for the container',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default empty state with a primary action button.
 * Represents the most common usage — VPN interfaces not yet configured.
 */
export const Default: Story = {
  args: {
    icon: Shield,
    title: 'No WireGuard interfaces configured',
    description:
      "Your router doesn't have any WireGuard VPN interfaces set up yet. Add one to start using secure VPN tunnels.",
    action: {
      label: 'Add VPN Interface',
      onClick: () => console.log('Add VPN clicked'),
      variant: 'action',
    },
  },
};

/**
 * Empty state without an action button.
 * Used when there is no user action possible — e.g., logs with no entries yet.
 */
export const WithoutAction: Story = {
  args: {
    icon: FileText,
    title: 'No log entries found',
    description:
      'There are no log entries matching your current filters. Try adjusting the filters or wait for new activity.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state without a CTA — used when no immediate action is available.',
      },
    },
  },
};

/**
 * Empty state for a WiFi / wireless interfaces page.
 * Uses the outline button variant to indicate a secondary-priority action.
 */
export const WirelessEmpty: Story = {
  args: {
    icon: Wifi,
    title: 'No wireless interfaces',
    description:
      'No wireless interfaces are detected on this router. Ensure your hardware supports WiFi or attach a compatible USB adapter.',
    action: {
      label: 'Scan for Interfaces',
      onClick: () => console.log('Scan clicked'),
      variant: 'outline',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state using the `outline` button variant for a secondary action.',
      },
    },
  },
};

/**
 * Empty state for services / feature marketplace.
 * Uses the default button variant.
 */
export const ServicesEmpty: Story = {
  args: {
    icon: Server,
    title: 'No services installed',
    description:
      'Browse the feature marketplace to install services such as AdGuard Home, Tor, sing-box, and more.',
    action: {
      label: 'Browse Marketplace',
      onClick: () => console.log('Browse marketplace clicked'),
      variant: 'default',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state using the `default` button variant.',
      },
    },
  },
};

/**
 * Empty state for an alert/notification rules page.
 */
export const AlertsEmpty: Story = {
  args: {
    icon: Bell,
    title: 'No alert rules configured',
    description:
      'Create alert rules to get notified when important events occur on your router, such as high CPU usage or interface failures.',
    action: {
      label: 'Create Alert Rule',
      onClick: () => console.log('Create alert clicked'),
      variant: 'action',
    },
  },
};

/**
 * Empty state shown when a search returns no results.
 * Demonstrates usage within a search context without an action.
 */
export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    description:
      'No items match your search query. Try different keywords or clear the search to see all entries.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state for zero search results — no action button since the user can simply clear the search.',
      },
    },
  },
};

/**
 * Empty state for a DHCP leases page with no active leases.
 * Demonstrates a database-context icon.
 */
export const DHCPEmpty: Story = {
  args: {
    icon: Database,
    title: 'No DHCP leases',
    description:
      'No devices are currently leasing an IP address from this router. Connect a device to the network to see its lease here.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state for a DHCP leases page with no active clients.',
      },
    },
  },
};
