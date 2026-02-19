/**
 * Stories for LogEntry component
 * Displays a single system log entry with timestamp, topic badge, severity badge, and message
 */

import { LogEntry } from './LogEntry';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof LogEntry> = {
  title: 'Patterns/LogEntry',
  component: LogEntry,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a single RouterOS system log entry with a formatted timestamp, color-coded topic badge, severity badge, copyable message, and optional bookmark. Supports compact (mobile) and full (desktop) layouts, plus search-term highlighting.',
      },
    },
  },
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'Use compact layout for mobile viewports',
    },
    showDate: {
      control: 'boolean',
      description: 'Include the full date in the timestamp instead of time only',
    },
    isBookmarked: {
      control: 'boolean',
      description: 'Whether the entry is currently bookmarked',
    },
    searchTerm: {
      control: 'text',
      description: 'Highlight matching text in the log message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LogEntry>;

// ---------------------------------------------------------------------------
// Shared mock entries
// ---------------------------------------------------------------------------

const firewallEntry = {
  id: 'log-001',
  timestamp: new Date('2025-03-15T10:34:22Z'),
  topic: 'firewall' as const,
  severity: 'warning' as const,
  message:
    'forward: in:ether1 out:bridge src-mac 00:0c:29:ab:cd:ef, proto TCP (SYN), 192.168.88.1:54321->8.8.8.8:443, len 60',
};

const dhcpEntry = {
  id: 'log-002',
  timestamp: new Date('2025-03-15T10:35:01Z'),
  topic: 'dhcp' as const,
  severity: 'info' as const,
  message: 'assigned 192.168.88.100 to 00:11:22:33:44:55',
};

const systemCriticalEntry = {
  id: 'log-003',
  timestamp: new Date('2025-03-15T10:36:55Z'),
  topic: 'system' as const,
  severity: 'critical' as const,
  message: 'System rebooted – unexpected power loss detected on ether2',
};

const vpnEntry = {
  id: 'log-004',
  timestamp: new Date('2025-03-15T09:00:00Z'),
  topic: 'vpn' as const,
  severity: 'info' as const,
  message: 'WireGuard peer 10.10.0.2 handshake completed, session established',
};

const debugEntry = {
  id: 'log-005',
  timestamp: new Date('2025-03-15T08:55:12Z'),
  topic: 'dns' as const,
  severity: 'debug' as const,
  message: 'Query for example.com A resolved to 93.184.216.34 in 12ms',
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (Firewall Warning)',
  args: {
    entry: firewallEntry,
    showDate: false,
    isBookmarked: false,
    compact: false,
  },
};

export const InfoEntry: Story = {
  name: 'Info – DHCP Lease',
  args: {
    entry: dhcpEntry,
    showDate: false,
    isBookmarked: false,
    compact: false,
  },
};

export const CriticalEntry: Story = {
  name: 'Critical – System Reboot',
  args: {
    entry: systemCriticalEntry,
    showDate: true,
    isBookmarked: false,
    compact: false,
  },
};

export const WithSearchHighlight: Story = {
  name: 'With Search Highlight',
  args: {
    entry: firewallEntry,
    searchTerm: '192.168.88.1',
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `searchTerm` is provided the matching text inside the message is highlighted using a primary-coloured `<mark>` element.',
      },
    },
  },
};

export const Bookmarked: Story = {
  name: 'Bookmarked Entry',
  args: {
    entry: vpnEntry,
    isBookmarked: true,
    onToggleBookmark: (entry) => alert(`Toggle bookmark: ${entry.id}`),
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `isBookmarked` is true and `onToggleBookmark` is provided the Pin icon appears filled. The action buttons become visible on hover.',
      },
    },
  },
};

export const CompactMobile: Story = {
  name: 'Compact (Mobile Layout)',
  args: {
    entry: systemCriticalEntry,
    compact: true,
    isBookmarked: false,
    onToggleBookmark: (entry) => alert(`Toggle bookmark: ${entry.id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The compact layout stacks badges and message vertically for narrow mobile viewports, using smaller type and condensed spacing.',
      },
    },
  },
};

export const DebugSeverity: Story = {
  name: 'Debug Severity',
  args: {
    entry: debugEntry,
    showDate: true,
    compact: false,
  },
};
