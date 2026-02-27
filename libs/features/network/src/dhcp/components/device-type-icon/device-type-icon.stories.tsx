/**
 * Storybook stories for DeviceTypeIcon
 *
 * Displays the correct Lucide icon with category-based color coding
 * and an optional tooltip showing device type and confidence level.
 * Part of the DHCP Fingerprinting feature (NAS-6.13).
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import type {
  FingerprintDeviceType,
  FingerprintDeviceCategory,
} from '@nasnet/core/types';

import { DeviceTypeIcon } from './device-type-icon';

const meta: Meta<typeof DeviceTypeIcon> = {
  title: 'Features/Network/DHCP/DeviceTypeIcon',
  component: DeviceTypeIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays the appropriate icon for a fingerprinted DHCP device type with ' +
          'category-based color coding. Supports 22 device types across 6 categories ' +
          '(mobile, computer, IoT, network, entertainment, other). ' +
          'Shows a tooltip with the device type label and optional confidence percentage.',
      },
    },
  },
  argTypes: {
    deviceType: {
      control: 'select',
      options: [
        'ios',
        'android',
        'other-mobile',
        'windows',
        'macos',
        'linux',
        'chromeos',
        'smart-speaker',
        'camera',
        'thermostat',
        'other-iot',
        'printer',
        'nas',
        'router',
        'switch',
        'gaming-console',
        'smart-tv',
        'streaming-device',
        'generic',
        'server',
        'appliance',
        'unknown',
      ] satisfies FingerprintDeviceType[],
      description: 'Device type from DHCP fingerprinting',
    },
    deviceCategory: {
      control: 'select',
      options: [
        'mobile',
        'computer',
        'iot',
        'network',
        'entertainment',
        'other',
      ] satisfies FingerprintDeviceCategory[],
      description: 'Category for color coding',
    },
    confidence: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Fingerprint confidence (0-100)',
    },
    showTooltip: {
      control: 'boolean',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DeviceTypeIcon>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * iOS device — mobile category, rendered in info-blue.
 * Tooltip shows "iOS (95% confidence)".
 */
export const IosDevice: Story = {
  args: {
    deviceType: 'ios',
    deviceCategory: 'mobile',
    confidence: 95,
    showTooltip: true,
  },
};

/**
 * Windows PC — computer category, rendered in success-green.
 */
export const WindowsPC: Story = {
  args: {
    deviceType: 'windows',
    deviceCategory: 'computer',
    confidence: 88,
    showTooltip: true,
  },
};

/**
 * IoT smart speaker — IoT category, rendered in warning-amber.
 */
export const SmartSpeaker: Story = {
  args: {
    deviceType: 'smart-speaker',
    deviceCategory: 'iot',
    confidence: 72,
    showTooltip: true,
  },
};

/**
 * Network router — network category, uses accent-foreground color.
 */
export const NetworkRouter: Story = {
  args: {
    deviceType: 'router',
    deviceCategory: 'network',
    confidence: 99,
    showTooltip: true,
  },
};

/**
 * Unknown device — "other" category, rendered in muted-foreground gray.
 * Tooltip shows "Unknown" with no confidence value.
 */
export const UnknownDevice: Story = {
  args: {
    deviceType: 'unknown',
    deviceCategory: 'other',
    confidence: undefined,
    showTooltip: true,
  },
};

/**
 * Clickable icon variant. Wraps the icon in a 44px touch-target button.
 * The onClick callback fires when the icon is pressed.
 */
export const Clickable: Story = {
  args: {
    deviceType: 'macos',
    deviceCategory: 'computer',
    confidence: 91,
    showTooltip: true,
    onClick: fn(),
  },
};

/**
 * No tooltip — icon only without any Tooltip wrapper.
 * Useful when surrounding context already communicates the device type.
 */
export const NoTooltip: Story = {
  args: {
    deviceType: 'gaming-console',
    deviceCategory: 'entertainment',
    confidence: 80,
    showTooltip: false,
  },
};

/**
 * Gallery of all 6 device categories side-by-side.
 * Each icon uses its category color class.
 */
export const AllCategories: Story = {
  render: () => (
    <div className="flex items-center gap-component-lg p-component-sm">
      {(
        [
          { deviceType: 'ios', deviceCategory: 'mobile', label: 'Mobile' },
          { deviceType: 'windows', deviceCategory: 'computer', label: 'Computer' },
          { deviceType: 'camera', deviceCategory: 'iot', label: 'IoT' },
          { deviceType: 'nas', deviceCategory: 'network', label: 'Network' },
          { deviceType: 'smart-tv', deviceCategory: 'entertainment', label: 'Entertainment' },
          { deviceType: 'generic', deviceCategory: 'other', label: 'Other' },
        ] as Array<{
          deviceType: FingerprintDeviceType;
          deviceCategory: FingerprintDeviceCategory;
          label: string;
        }>
      ).map(({ deviceType, deviceCategory, label }) => (
        <div key={deviceType} className="flex flex-col items-center gap-2">
          <DeviceTypeIcon
            deviceType={deviceType}
            deviceCategory={deviceCategory}
            confidence={85}
            showTooltip
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
};
