import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { LogActionMenu } from './LogActionMenu';
import type { LogEntry } from '@nasnet/core/types';

/**
 * Mock log entries covering every topic that produces topic-specific actions.
 */
const makeEntry = (
  topic: LogEntry['topic'],
  message: string,
  severity: LogEntry['severity'] = 'info'
): LogEntry => ({
  id: `log-${topic}-001`,
  timestamp: new Date('2024-06-15T10:32:00Z'),
  topic,
  severity,
  message,
});

const firewallEntry = makeEntry(
  'firewall',
  'input: in:ether1 out:(none), src-mac 11:22:33:44:55:66, proto TCP (SYN), 203.0.113.42:51234->192.168.88.1:22, len 60 from 203.0.113.42',
  'warning'
);

const dhcpEntry = makeEntry(
  'dhcp',
  'dhcp1: 192.168.88.105 assigned to 00:1A:2B:3C:4D:5E'
);

const wirelessEntry = makeEntry(
  'wireless',
  'wlan1: 00:1A:2B:3C:4D:5E connected',
  'info'
);

const systemEntry = makeEntry(
  'system',
  'system rebooted — RouterOS 7.14.2',
  'info'
);

const interfaceEntry = makeEntry(
  'interface',
  'ether1 link down',
  'error'
);

const meta: Meta<typeof LogActionMenu> = {
  title: 'Features/Logs/LogActionMenu',
  component: LogActionMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Context-menu (dropdown) for a single log entry. ' +
          'Renders topic-specific quick-actions (e.g. "Block IP", "Make Lease Static") ' +
          'above a separator, followed by common actions (Copy, Bookmark, View Details). ' +
          'The icon set is resolved at runtime from a lucide-react name registry.',
      },
    },
  },
  args: {
    onAction: fn(),
    isBookmarked: false,
  },
};

export default meta;
type Story = StoryObj<typeof LogActionMenu>;

/**
 * Firewall topic — shows "View Firewall Rule", "Add IP to Whitelist", "Block IP Address"
 * plus the common actions. The IP 203.0.113.42 will be extracted from the message.
 */
export const FirewallEntry: Story = {
  name: 'Firewall (topic-specific actions)',
  args: {
    entry: firewallEntry,
  },
};

/**
 * DHCP topic — shows "View DHCP Lease" and "Make Lease Static".
 */
export const DhcpEntry: Story = {
  name: 'DHCP (lease actions)',
  args: {
    entry: dhcpEntry,
  },
};

/**
 * Wireless topic — shows "View Wireless Client" and "Disconnect Client".
 */
export const WirelessEntry: Story = {
  name: 'Wireless (client actions)',
  args: {
    entry: wirelessEntry,
  },
};

/**
 * System topic — no topic-specific actions; only common actions are shown.
 */
export const SystemEntryCommonOnly: Story = {
  name: 'System (common actions only)',
  args: {
    entry: systemEntry,
  },
};

/**
 * Interface topic — shows "View Interface" plus common actions.
 */
export const InterfaceEntry: Story = {
  name: 'Interface (single topic action)',
  args: {
    entry: interfaceEntry,
  },
};

/**
 * Bookmarked state — the Bookmark menu item switches to "Remove Bookmark"
 * and the Pin icon is filled with the primary color.
 */
export const Bookmarked: Story = {
  name: 'Bookmarked entry',
  args: {
    entry: systemEntry,
    isBookmarked: true,
  },
};

/**
 * Custom trigger slot — replace the default MoreVertical icon with an explicit button.
 */
export const CustomTrigger: Story = {
  name: 'Custom trigger element',
  args: {
    entry: firewallEntry,
    trigger: (
      <button
        style={{
          padding: '4px 12px',
          background: '#EFC729',
          color: '#1a1a1a',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Actions
      </button>
    ),
  },
};
