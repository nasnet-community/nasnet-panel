import { VPNTypeSection } from './VPNTypeSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNTypeSection> = {
  title: 'Patterns/VPNTypeSection',
  component: VPNTypeSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collapsible section component for grouping VPN interfaces by type (L2TP, PPTP, SSTP, etc.). Displays protocol name, interface count badge, read-only notice, and expandable content area with animated transitions.',
      },
    },
  },
  argTypes: {
    type: { control: 'text' },
    count: { control: 'number' },
    defaultExpanded: { control: 'boolean' },
    showReadOnlyNotice: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNTypeSection>;

export const Collapsed: Story = {
  args: {
    type: 'L2TP',
    count: 2,
    defaultExpanded: false,
    showReadOnlyNotice: true,
    children: (
      <div className="space-y-3">
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">L2TP Interface 1</p>
          <p className="text-xs text-muted-foreground">192.168.1.1:1701</p>
        </div>
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">L2TP Interface 2</p>
          <p className="text-xs text-muted-foreground">192.168.1.2:1701</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Section collapsed by default. Click header to expand and view contained interfaces.',
      },
    },
  },
};

export const Expanded: Story = {
  args: {
    type: 'PPTP',
    count: 1,
    defaultExpanded: true,
    showReadOnlyNotice: true,
    children: (
      <div className="p-4 bg-muted/50 rounded border border-border">
        <p className="text-sm font-medium">PPTP Interface</p>
        <p className="text-xs text-muted-foreground">10.0.0.1:1723</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Section expanded by default. Shows read-only notice and single interface card.',
      },
    },
  },
};

export const SingleInterface: Story = {
  args: {
    type: 'SSTP',
    count: 1,
    defaultExpanded: false,
    showReadOnlyNotice: true,
    children: (
      <div className="p-4 bg-muted/50 rounded border border-border">
        <p className="text-sm font-medium">SSTP Tunnel</p>
        <p className="text-xs text-muted-foreground">Status: Connected</p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single interface scenario — badge shows "1 interface" (singular form).',
      },
    },
  },
};

export const MultipleInterfaces: Story = {
  args: {
    type: 'IKEv2',
    count: 5,
    defaultExpanded: false,
    showReadOnlyNotice: true,
    children: (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">IKEv2 Interface {i}</p>
            <p className="text-xs text-muted-foreground">
              Connected clients: {Math.floor(Math.random() * 10)}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple interfaces (5). Demonstrates scrollable expanded content.',
      },
    },
  },
};

export const NoReadOnlyNotice: Story = {
  args: {
    type: 'WireGuard',
    count: 3,
    defaultExpanded: true,
    showReadOnlyNotice: false,
    children: (
      <div className="space-y-3">
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">WireGuard Server 1</p>
          <p className="text-xs text-muted-foreground">51820 - Active</p>
        </div>
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">WireGuard Server 2</p>
          <p className="text-xs text-muted-foreground">51821 - Active</p>
        </div>
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">WireGuard Server 3</p>
          <p className="text-xs text-muted-foreground">51822 - Inactive</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only notice disabled — useful for fully editable sections.',
      },
    },
  },
};

export const WithBadgeIcon: Story = {
  args: {
    type: 'OpenVPN',
    count: 2,
    defaultExpanded: false,
    showReadOnlyNotice: true,
    icon: <span className="text-lg">🔐</span>,
    children: (
      <div className="space-y-3">
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">OpenVPN CA Server</p>
          <p className="text-xs text-muted-foreground">1194/tcp - 12 clients</p>
        </div>
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">OpenVPN UDP Server</p>
          <p className="text-xs text-muted-foreground">1194/udp - 8 clients</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'With optional icon displayed next to protocol name.',
      },
    },
  },
};

export const Grouped: Story = {
  render: () => (
    <div className="space-y-3 w-full max-w-2xl">
      <VPNTypeSection type="L2TP" count={2} defaultExpanded={false} showReadOnlyNotice={true}>
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">L2TP 1</p>
          </div>
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">L2TP 2</p>
          </div>
        </div>
      </VPNTypeSection>
      <VPNTypeSection type="PPTP" count={1} defaultExpanded={false} showReadOnlyNotice={true}>
        <div className="p-4 bg-muted/50 rounded border border-border">
          <p className="text-sm font-medium">PPTP 1</p>
        </div>
      </VPNTypeSection>
      <VPNTypeSection type="SSTP" count={3} defaultExpanded={false} showReadOnlyNotice={true}>
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">SSTP 1</p>
          </div>
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">SSTP 2</p>
          </div>
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-sm font-medium">SSTP 3</p>
          </div>
        </div>
      </VPNTypeSection>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple sections grouped together showing how they appear in the actual VPN interface list page.',
      },
    },
  },
};
