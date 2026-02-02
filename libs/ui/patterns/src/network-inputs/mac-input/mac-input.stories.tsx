/**
 * MAC Address Input Storybook Stories
 *
 * Demonstrates all features and states of the MACInput component.
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MACInput } from './mac-input';
import { MACInputDesktop } from './mac-input-desktop';
import { MACInputMobile } from './mac-input-mobile';

const meta: Meta<typeof MACInput> = {
  title: 'Patterns/Network Inputs/MACInput',
  component: MACInput,
  tags: ['autodocs'],
  argTypes: {
    format: {
      control: 'select',
      options: ['colon', 'dash', 'dot'],
      description: 'Output format for the MAC address',
    },
    showVendor: {
      control: 'boolean',
      description: 'Show vendor lookup from OUI prefix',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    label: {
      control: 'text',
      description: 'Label text for the input',
    },
    error: {
      control: 'text',
      description: 'External error message',
    },
    placeholder: {
      control: 'text',
      description: 'Custom placeholder text',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
MAC Address Input component with:
- Multi-format parsing (colon, dash, dot, no separator)
- Auto-formatting with uppercase conversion
- OUI vendor lookup from embedded database
- Platform-responsive design (mobile/desktop)
- WCAG AAA accessibility compliance

### Features
- **Multi-format acceptance**: Paste MACs in any format, auto-normalizes
- **Vendor lookup**: Identifies device manufacturer from OUI prefix
- **Format options**: Choose colon, dash, or Cisco dot notation
- **Accessibility**: Full ARIA support, 44px touch targets on mobile
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MACInput>;

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default empty state with colon format.
 */
export const Default: Story = {
  args: {},
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With a valid MAC address in colon format.
 */
export const WithValidMAC_Colon: Story = {
  args: {
    format: 'colon',
  },
  render: function Render(args) {
    const [value, setValue] = useState('AA:BB:CC:DD:EE:FF');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With a valid MAC address in dash format.
 */
export const WithValidMAC_Dash: Story = {
  args: {
    format: 'dash',
  },
  render: function Render(args) {
    const [value, setValue] = useState('AA-BB-CC-DD-EE-FF');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With a valid MAC address in Cisco dot format.
 */
export const WithValidMAC_Dot: Story = {
  args: {
    format: 'dot',
  },
  render: function Render(args) {
    const [value, setValue] = useState('AABB.CCDD.EEFF');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

// ============================================================================
// Vendor Lookup Stories
// ============================================================================

/**
 * With vendor lookup enabled showing VMware.
 */
export const WithVendorLookup_VMware: Story = {
  args: {
    showVendor: true,
    label: 'MAC Address',
  },
  render: function Render(args) {
    const [value, setValue] = useState('00:50:56:AA:BB:CC');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With vendor lookup enabled showing MikroTik.
 */
export const WithVendorLookup_MikroTik: Story = {
  args: {
    showVendor: true,
    label: 'MAC Address',
  },
  render: function Render(args) {
    const [value, setValue] = useState('00:0C:42:AA:BB:CC');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With vendor lookup showing unknown vendor.
 */
export const WithVendorLookup_Unknown: Story = {
  args: {
    showVendor: true,
    label: 'MAC Address',
  },
  render: function Render(args) {
    const [value, setValue] = useState('11:22:33:44:55:66');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

// ============================================================================
// State Stories
// ============================================================================

/**
 * With external error state.
 */
export const WithError: Story = {
  args: {
    error: 'This MAC address is already in use',
    label: 'MAC Address',
  },
  render: function Render(args) {
    const [value, setValue] = useState('AA:BB:CC:DD:EE:FF');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Disabled input state.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'MAC Address',
  },
  render: function Render(args) {
    const [value, setValue] = useState('AA:BB:CC:DD:EE:FF');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * With label and required indicator.
 */
export const WithLabel: Story = {
  args: {
    label: 'Device MAC Address',
    required: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <MACInput {...args} value={value} onChange={setValue} />;
  },
};

// ============================================================================
// Platform-Specific Stories
// ============================================================================

/**
 * Desktop presenter explicitly.
 */
export const DesktopVariant: Story = {
  render: function Render() {
    const [value, setValue] = useState('00:50:56:AA:BB:CC');
    return (
      <MACInputDesktop
        value={value}
        onChange={setValue}
        label="Desktop MAC Input"
        showVendor
      />
    );
  },
};

/**
 * Mobile presenter explicitly (44px touch target, vendor below).
 */
export const MobileVariant: Story = {
  render: function Render() {
    const [value, setValue] = useState('00:50:56:AA:BB:CC');
    return (
      <div className="max-w-sm">
        <MACInputMobile
          value={value}
          onChange={setValue}
          label="Mobile MAC Input"
          showVendor
        />
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// ============================================================================
// Interactive Demo
// ============================================================================

/**
 * Interactive demo with all features.
 */
export const InteractiveDemo: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    const [format, setFormat] = useState<'colon' | 'dash' | 'dot'>('colon');
    const [showVendor, setShowVendor] = useState(true);

    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === 'colon'}
              onChange={() => setFormat('colon')}
            />
            Colon (AA:BB:CC:DD:EE:FF)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === 'dash'}
              onChange={() => setFormat('dash')}
            />
            Dash (AA-BB-CC-DD-EE-FF)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === 'dot'}
              onChange={() => setFormat('dot')}
            />
            Dot (AABB.CCDD.EEFF)
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showVendor}
            onChange={(e) => setShowVendor(e.target.checked)}
          />
          Show vendor lookup
        </label>

        <MACInput
          value={value}
          onChange={setValue}
          format={format}
          showVendor={showVendor}
          label="MAC Address"
        />

        <div className="text-sm text-muted-foreground">
          <p>Current value: <code>{value || '(empty)'}</code></p>
          <p className="mt-2">Try pasting these:</p>
          <ul className="list-disc list-inside">
            <li>00:50:56:AA:BB:CC (VMware)</li>
            <li>00-0C-42-AA-BB-CC (MikroTik)</li>
            <li>B827.EBAA.BBCC (Raspberry Pi - Cisco format)</li>
            <li>AABBCCDDEEFF (no separators)</li>
          </ul>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/**
 * With aria-describedby for help text integration.
 */
export const WithHelpText: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-2">
        <MACInput
          value={value}
          onChange={setValue}
          label="MAC Address"
          aria-describedby="mac-help"
        />
        <p id="mac-help" className="text-sm text-muted-foreground">
          Enter the device MAC address. You can paste it in any format.
        </p>
      </div>
    );
  },
};
