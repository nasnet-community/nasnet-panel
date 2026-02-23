/**
 * BogonFilterDialog Storybook Stories
 *
 * Interactive stories for bogon filter dialog component.
 * Demonstrates the Headless + Platform Presenters pattern with
 * responsive layouts for Mobile, Tablet, and Desktop platforms.
 *
 * @see [Component Library Catalog](../../../../../../Docs/design/ux-design/6-component-library.md)
 * @see [Responsive Design Guide](../../../../../../Docs/design/ux-design/8-responsive-design-accessibility.md)
 */

import { fn } from 'storybook/test';

import { BogonFilterDialog } from './BogonFilterDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Patterns/Firewall/BogonFilterDialog',
  component: BogonFilterDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bogon filter dialog for configuring IP range filtering on WAN interfaces. ' +
          'Blocks non-routable (bogon) IP addresses to prevent spoofing attacks. ' +
          'Automatically adapts to Mobile (Sheet), Tablet/Desktop (Dialog) layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID for creating filter rules',
    },
    open: {
      control: 'boolean',
      description: 'Is dialog open',
    },
    onClose: {
      action: 'dialog closed',
      description: 'Callback when dialog is closed',
    },
    onSuccess: {
      action: 'rules created',
      description: 'Callback when rules are successfully created',
    },
    availableInterfaces: {
      control: 'object',
      description: 'Available WAN interfaces for selection',
    },
  },
  args: {
    routerId: 'router-123',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    availableInterfaces: ['ether1-wan', 'ether2-wan', 'pppoe-out1'],
  },
} satisfies Meta<typeof BogonFilterDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story: Desktop view with open dialog.
 * Shows full feature set with checkbox grid and detailed descriptions.
 */
export const Default: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Mobile view: Sheet-based presentation with 44px touch targets.
 * Optimized for thumb navigation with card-based layout.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view: Hybrid layout with balanced information density.
 */
export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop view: Full-featured dialog with dense checkbox grid.
 */
export const DesktopView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Closed state: Dialog not visible.
 */
export const Closed: Story = {
  args: {
    open: false,
  },
};

/**
 * Single interface available (minimal options).
 */
export const SingleInterface: Story = {
  args: {
    availableInterfaces: ['ether1-wan'],
  },
};

/**
 * Many interfaces available (many WAN connections).
 */
export const ManyInterfaces: Story = {
  args: {
    availableInterfaces: [
      'ether1-wan',
      'ether2-wan',
      'pppoe-out1',
      'pppoe-out2',
      'vlan-wan',
      'wireguard-out',
    ],
  },
};
