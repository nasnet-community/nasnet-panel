/**
 * WifiInterfaceList Stories
 *
 * WifiInterfaceList is a thin wrapper around WirelessInterfaceList with a
 * "Wireless Interfaces" section header.  Because it delegates all data
 * fetching to the feature library, stories show the structural shell and
 * document the single required prop.
 */

import { WifiInterfaceList } from './WifiInterfaceList';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WifiInterfaceList> = {
  title: 'App/WiFi/WifiInterfaceList',
  component: WifiInterfaceList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wrapper component that pairs a "Wireless Interfaces" section ' +
          'header with the feature-library WirelessInterfaceList. Accepts a ' +
          '`routerId` and delegates all data fetching to the inner component.',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'ID of the router whose wireless interfaces to display.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WifiInterfaceList>;

/** Default render with a typical router ID. */
export const Default: Story = {
  args: {
    routerId: 'router-001',
  },
};

/** Numeric-style router ID used by some MikroTik installations. */
export const NumericRouterId: Story = {
  args: {
    routerId: '42',
  },
};

/** UUID-style router ID (common when routers are stored by UUID). */
export const UuidRouterId: Story = {
  args: {
    routerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
};

/**
 * Shows what the header looks like inside a padded card container, which is
 * the typical host context within WifiPage.
 */
export const InsideCard: Story = {
  args: {
    routerId: 'router-lab-01',
  },
  decorators: [
    (Story) => (
      <div className="border-border bg-card max-w-2xl rounded-xl border p-6 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

/**
 * Simulates the component embedded inside the full WifiPage column layout
 * (single-column, full-width on mobile).
 */
export const MobileWidth: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Mobile: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
