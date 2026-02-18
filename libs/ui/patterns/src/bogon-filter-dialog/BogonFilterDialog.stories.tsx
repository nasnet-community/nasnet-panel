/**
 * BogonFilterDialog Storybook Stories
 *
 * Interactive stories for bogon filter dialog.
 */

import { fn } from '@storybook/test';

import { BogonFilterDialog } from './BogonFilterDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Patterns/Firewall/BogonFilterDialog',
  component: BogonFilterDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

export const Default: Story = {};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
