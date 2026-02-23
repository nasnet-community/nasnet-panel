/**
 * Storybook stories for IPAddressDisplay
 *
 * Renders an IP address as a badge or plain text with optional context-menu
 * support (right-click on desktop, long-press on mobile) for adding the
 * address to firewall address lists.
 *
 * Note: The component uses usePlatform() and the AddToAddressListContextMenu
 * which are network-aware. In Storybook we render with showContextMenu=false
 * for static stories and leave it enabled for interaction stories.
 */

import { fn } from 'storybook/test';

import { IPAddressDisplay } from './IPAddressDisplay';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof IPAddressDisplay> = {
  title: 'Features/Firewall/IPAddressDisplay',
  component: IPAddressDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays an IP address with optional label. On desktop a right-click context menu lets the user add the IP to a firewall address list. On mobile a long-press triggers a bottom sheet with the same action.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['badge', 'text'],
      description: 'Render the IP as an outlined badge or plain monospace text.',
    },
    showContextMenu: {
      control: 'boolean',
      description: 'Whether to attach the right-click / long-press context menu.',
    },
  },
  args: {
    onAddToList: fn(),
    showContextMenu: false,
  },
};

export default meta;
type Story = StoryObj<typeof IPAddressDisplay>;

/**
 * Default badge display — no label, no context menu.
 */
export const Default: Story = {
  args: {
    ipAddress: '192.168.1.100',
    variant: 'badge',
  },
};

/**
 * Badge with a descriptive label prepended.
 */
export const BadgeWithLabel: Story = {
  args: {
    ipAddress: '10.0.0.1',
    label: 'Gateway',
    variant: 'badge',
  },
};

/**
 * Plain text variant — useful in dense table cells.
 */
export const PlainText: Story = {
  args: {
    ipAddress: '172.16.0.254',
    label: 'Source',
    variant: 'text',
  },
};

/**
 * IPv6 address in badge form.
 */
export const IPv6Address: Story = {
  args: {
    ipAddress: 'fd00::1',
    label: 'Src',
    variant: 'badge',
  },
};

/**
 * Multiple addresses side by side — shows how they look in a table row.
 */
export const MultipleAddresses: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <IPAddressDisplay
        ipAddress="192.168.1.10"
        label="Src"
        variant="badge"
        showContextMenu={false}
      />
      <span className="text-muted-foreground text-sm">→</span>
      <IPAddressDisplay
        ipAddress="8.8.8.8"
        label="Dst"
        variant="badge"
        showContextMenu={false}
      />
    </div>
  ),
};

/**
 * Context menu enabled — right-click to open the "Add to Address List" menu
 * when running inside a real browser context (not all Storybook environments
 * support the Radix ContextMenu).
 */
export const WithContextMenu: Story = {
  args: {
    ipAddress: '203.0.113.42',
    label: 'Source',
    variant: 'badge',
    showContextMenu: true,
    existingLists: ['blocklist', 'allowlist', 'country-iran'],
    onAddToList: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Right-click (desktop) or long-press (mobile) the badge to open the "Add to Address List" context menu. Existing lists are provided via the existingLists prop.',
      },
    },
  },
};
