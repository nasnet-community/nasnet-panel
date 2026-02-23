/**
 * VPNCardEnhanced Storybook Stories
 *
 * Demonstrates the VPNCardEnhanced pattern for quick VPN toggle
 * with status display. Covers connected, connecting, disconnected,
 * and error states.
 *
 * @module @nasnet/ui/patterns/vpn-card-enhanced
 */

import { fn } from 'storybook/test';

import { VPNCardEnhanced } from './VPNCardEnhanced';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNCardEnhanced> = {
  title: 'Patterns/VPN/VPNCardEnhanced',
  component: VPNCardEnhanced,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A compact VPN status card with quick toggle for dashboard integration.

## Features
- Status indicator (Connected / Connecting / Disconnected / Error)
- Profile information with location and country flag
- Quick toggle switch for enable/disable
- Loading state during connection
- Disabled state support

## Usage
\`\`\`tsx
import { VPNCardEnhanced } from '@nasnet/ui/patterns';

<VPNCardEnhanced
  status="connected"
  profile={{ name: 'Office VPN', location: 'Frankfurt', flag: '🇩🇪' }}
  onToggle={(enabled) => handleToggle(enabled)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['disconnected', 'connecting', 'connected', 'error'],
      description: 'Current VPN connection status',
    },
    onToggle: {
      description: 'Toggle handler called when switch is toggled',
      action: 'toggled',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable toggle interaction',
    },
  },
  args: {
    onToggle: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof VPNCardEnhanced>;

// ============================================================================
// Stories
// ============================================================================

/**
 * VPN is currently connected to the office location.
 */
export const Connected: Story = {
  name: 'Connected',
  args: {
    status: 'connected',
    profile: {
      name: 'Office VPN',
      location: 'Frankfurt',
      flag: '🇩🇪',
    },
  },
};

/**
 * VPN connection is in progress.
 */
export const Connecting: Story = {
  name: 'Connecting',
  args: {
    status: 'connecting',
    profile: {
      name: 'Work Network',
      location: 'Berlin',
      flag: '🇩🇪',
    },
  },
};

/**
 * VPN is disconnected.
 */
export const Disconnected: Story = {
  name: 'Disconnected',
  args: {
    status: 'disconnected',
    profile: {
      name: 'Home Office',
      location: 'Germany',
    },
  },
};

/**
 * VPN connection failed with error state.
 */
export const Error: Story = {
  name: 'Error',
  args: {
    status: 'error',
    profile: {
      name: 'Backup VPN',
      location: 'Amsterdam',
      flag: '🇳🇱',
    },
  },
};

/**
 * Minimal variant without profile information.
 */
export const NoProfile: Story = {
  name: 'No Profile Info',
  args: {
    status: 'connected',
  },
};

/**
 * Toggle switch is disabled (e.g., during connection or due to permissions).
 */
export const Disabled: Story = {
  name: 'Disabled',
  args: {
    status: 'disconnected',
    disabled: true,
    profile: {
      name: 'Locked VPN',
      location: 'Restricted',
    },
  },
};

/**
 * Connected with US flag.
 */
export const ConnectedUS: Story = {
  name: 'Connected — US Location',
  args: {
    status: 'connected',
    profile: {
      name: 'US Gateway',
      location: 'New York',
      flag: '🇺🇸',
    },
  },
};
