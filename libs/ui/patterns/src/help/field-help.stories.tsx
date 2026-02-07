/**
 * Field Help Storybook Stories
 *
 * Demonstrates the FieldHelp component and its variants.
 *
 * @module @nasnet/ui/patterns/help
 * @see NAS-4A.12: Build Help System Components
 */

import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Label, Input, cn } from '@nasnet/ui/primitives';

import {
  FieldHelp,
  FieldHelpDesktop,
  FieldHelpMobile,
  HelpModeToggle,
  HelpIcon,
  HelpPopover,
  HelpSheet,
  useFieldHelp,
  useHelpMode,
} from './index';
import type { HelpContent } from './help.types';

/**
 * FieldHelp displays contextual help for form fields with Simple/Technical mode toggle.
 *
 * **Features:**
 * - Platform-responsive: Popover on desktop, bottom sheet on mobile
 * - Simple/Technical mode toggle for different audiences
 * - i18n integration with lazy-loaded translations
 * - RTL support for Persian and Arabic
 * - WCAG AAA accessible with proper ARIA labels
 *
 * **Usage Patterns:**
 * - Place next to form labels for contextual help
 * - Use HelpModeToggle in settings to let users choose terminology level
 * - All help content comes from i18n (network:help namespace)
 *
 * @see ADR-018: Headless + Platform Presenters
 */
const meta: Meta<typeof FieldHelp> = {
  title: 'Patterns/Help/FieldHelp',
  component: FieldHelp,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Contextual help for form fields. Shows a help icon that opens a popover (desktop) or bottom sheet (mobile) with explanations, examples, and documentation links.',
      },
    },
  },
  argTypes: {
    field: {
      control: 'select',
      options: ['ip', 'gateway', 'subnet', 'mac', 'port', 'interface', 'dns', 'vlan', 'dhcp', 'firewall', 'nat', 'mtu'],
      description: 'Field key for looking up help content in i18n',
    },
    mode: {
      control: 'select',
      options: [undefined, 'simple', 'technical'],
      description: 'Override global mode for this instance',
    },
    placement: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Popover placement (desktop only)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FieldHelp>;

// Mock help content for stories (in real app, this comes from i18n)
const mockHelpContent: Record<string, HelpContent> = {
  ip: {
    title: 'IP Address',
    description: 'The unique address that identifies this device on the network',
    examples: ['192.168.1.1', '10.0.0.1', '172.16.0.1'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:IP/Address',
  },
  gateway: {
    title: 'Gateway',
    description: 'The router that connects your network to the internet',
    examples: ['192.168.1.1'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:IP/Route',
  },
  subnet: {
    title: 'Network Size',
    description: 'How many devices can be on this network',
    examples: ['192.168.1.0/24 (254 hosts)', '10.0.0.0/8 (16M hosts)'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:IP/Address#Network_prefix',
  },
  mac: {
    title: 'Hardware Address',
    description: "The unique identifier burned into your network device's hardware",
    examples: ['AA:BB:CC:DD:EE:FF', '00:50:56:00:00:01'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:Interface',
  },
  port: {
    title: 'Port Number',
    description: "The 'door number' that applications use to communicate",
    examples: ['80 (HTTP)', '443 (HTTPS)', '22 (SSH)'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter',
  },
  interface: {
    title: 'Network Port',
    description: 'The physical or virtual port where devices connect',
    examples: ['ether1', 'bridge-lan', 'wlan1'],
    link: 'https://wiki.mikrotik.com/wiki/Manual:Interface',
  },
};

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Basic IP Address help - demonstrates default behavior.
 */
export const IPAddressHelp: Story = {
  args: {
    field: 'ip',
    placement: 'right',
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Label>IP Address</Label>
      <FieldHelp {...args} />
    </div>
  ),
};

/**
 * Gateway help with bottom placement.
 */
export const GatewayHelp: Story = {
  args: {
    field: 'gateway',
    placement: 'bottom',
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Label>Gateway</Label>
      <FieldHelp {...args} />
    </div>
  ),
};

/**
 * Subnet/CIDR help with top placement.
 */
export const SubnetHelp: Story = {
  args: {
    field: 'subnet',
    placement: 'top',
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Label>Subnet Mask</Label>
      <FieldHelp {...args} />
    </div>
  ),
};

// ============================================================================
// Mode Stories
// ============================================================================

/**
 * Technical mode - shows advanced terminology.
 */
export const TechnicalMode: Story = {
  args: {
    field: 'ip',
    mode: 'technical',
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mode set to "technical" - will show advanced terminology
      </p>
      <div className="flex items-center gap-2">
        <Label>IPv4/IPv6 Address</Label>
        <FieldHelp {...args} />
      </div>
    </div>
  ),
};

/**
 * Simple mode - shows user-friendly explanations.
 */
export const SimpleMode: Story = {
  args: {
    field: 'ip',
    mode: 'simple',
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mode set to "simple" - will show beginner-friendly explanations
      </p>
      <div className="flex items-center gap-2">
        <Label>IP Address</Label>
        <FieldHelp {...args} />
      </div>
    </div>
  ),
};

// ============================================================================
// Mobile Stories
// ============================================================================

/**
 * Mobile variant - shows bottom sheet instead of popover.
 */
export const MobileVariant: Story = {
  args: {
    field: 'gateway',
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Resize viewport to mobile to see bottom sheet variant
      </p>
      <div className="flex items-center gap-2">
        <Label>Gateway</Label>
        <FieldHelp {...args} />
      </div>
    </div>
  ),
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

// ============================================================================
// All Field Types
// ============================================================================

/**
 * All field types showcase - demonstrates help for various network fields.
 */
export const AllFieldTypes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <h3 className="font-semibold">Network Field Help Examples</h3>

      {(['ip', 'gateway', 'subnet', 'mac', 'port', 'interface'] as const).map((field) => (
        <div key={field} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="capitalize">{field}</Label>
            <FieldHelp field={field} />
          </div>
          <Input placeholder="..." className="w-32" />
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Help Mode Toggle
// ============================================================================

/**
 * Help Mode Toggle - allows users to switch between Simple and Technical modes.
 */
export const ModeToggle: StoryObj<typeof HelpModeToggle> = {
  render: () => {
    const { mode } = useHelpMode();

    return (
      <div className="space-y-6 p-4 border rounded-lg">
        <div className="space-y-2">
          <h3 className="font-semibold">Help Mode Toggle</h3>
          <p className="text-sm text-muted-foreground">
            Toggle between Simple and Technical terminology
          </p>
        </div>

        <HelpModeToggle />

        <div className="pt-4 border-t">
          <p className="text-sm">
            Current mode: <strong className="text-primary">{mode}</strong>
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Preview with current mode:</h4>
          <div className="flex items-center gap-2">
            <Label>Gateway</Label>
            <FieldHelp field="gateway" />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Compact Mode Toggle - for inline use.
 */
export const CompactModeToggle: StoryObj<typeof HelpModeToggle> = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="text-sm">Terminology:</span>
      <HelpModeToggle compact />
    </div>
  ),
};

// ============================================================================
// Form Integration Examples
// ============================================================================

/**
 * Form field integration - shows how FieldHelp integrates with form fields.
 */
export const FormFieldIntegration: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="ip-input">IP Address</Label>
          <FieldHelp field="ip" />
        </div>
        <Input id="ip-input" placeholder="192.168.1.100" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="gateway-input">Gateway</Label>
          <FieldHelp field="gateway" />
        </div>
        <Input id="gateway-input" placeholder="192.168.1.1" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="dns-input">DNS Server</Label>
          <FieldHelp field="dns" />
        </div>
        <Input id="dns-input" placeholder="8.8.8.8" />
      </div>
    </div>
  ),
};

// ============================================================================
// Dark Theme
// ============================================================================

/**
 * Dark theme - demonstrates appearance in dark mode.
 */
export const DarkTheme: Story = {
  args: {
    field: 'ip',
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background p-8 rounded-lg">
        <div className="flex items-center gap-2">
          <Label>IP Address</Label>
          <Story />
        </div>
      </div>
    ),
  ],
  globals: {
    backgrounds: {
      value: "dark"
    }
  },
};

// ============================================================================
// RTL Layout
// ============================================================================

/**
 * RTL layout - demonstrates Persian/Arabic right-to-left support.
 */
export const RTLLayout: Story = {
  args: {
    field: 'gateway',
    placement: 'left', // Will flip to right in RTL
  },
  decorators: [
    (Story) => (
      <div dir="rtl" className="p-8">
        <div className="flex items-center gap-2">
          <Label>Gateway</Label>
          <Story />
        </div>
      </div>
    ),
  ],
};

// ============================================================================
// Component Parts
// ============================================================================

/**
 * Help Icon standalone - just the trigger icon.
 */
export const HelpIconStandalone: StoryObj<typeof HelpIcon> = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <HelpIcon field="ip" size="sm" onClick={() => alert('Small icon clicked')} />
        <HelpIcon field="ip" size="md" onClick={() => alert('Medium icon clicked')} />
        <HelpIcon field="ip" size="lg" onClick={() => alert('Large icon clicked')} />
      </div>
      <p className="text-sm text-muted-foreground">
        Click icons to see alert (in real use, this opens help content)
      </p>
    </div>
  ),
};

/**
 * Help Popover standalone - desktop content display.
 */
export const HelpPopoverStandalone: StoryObj<typeof HelpPopover> = {
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <HelpPopover
        content={mockHelpContent.ip}
        placement="right"
        open={open}
        onOpenChange={setOpen}
      >
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => setOpen(true)}
        >
          Show Popover
        </button>
      </HelpPopover>
    );
  },
};

/**
 * Help Sheet standalone - mobile content display.
 */
export const HelpSheetStandalone: StoryObj<typeof HelpSheet> = {
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => setOpen(true)}
        >
          Show Sheet
        </button>
        <HelpSheet
          content={mockHelpContent.ip}
          open={open}
          onOpenChange={setOpen}
        />
      </>
    );
  },
};

// ============================================================================
// Accessibility
// ============================================================================

/**
 * Keyboard navigation - demonstrates keyboard accessibility.
 */
export const KeyboardNavigation: Story = {
  args: {
    field: 'ip',
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tab to focus the help icon, press Enter or Space to open, Escape to close.
      </p>
      <div className="flex items-center gap-2">
        <Label>IP Address</Label>
        <FieldHelp {...args} />
      </div>
    </div>
  ),
};

// ============================================================================
// Without Examples or Link
// ============================================================================

/**
 * Minimal content - help with no examples or link.
 */
export const MinimalContent: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <HelpPopover
        content={{
          title: 'Custom Field',
          description: 'This is a minimal help entry with no examples or link.',
        }}
        placement="right"
        open={open}
        onOpenChange={setOpen}
      >
        <HelpIcon field="custom" onClick={() => setOpen(!open)} />
      </HelpPopover>
    );
  },
};
