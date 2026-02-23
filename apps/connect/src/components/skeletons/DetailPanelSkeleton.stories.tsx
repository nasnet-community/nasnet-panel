import { DetailPanelSkeleton } from './DetailPanelSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DetailPanelSkeleton> = {
  title: 'App/Skeletons/DetailPanelSkeleton',
  component: DetailPanelSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading skeleton for detail and side panel views. Used for resource details and drawer content. Provides a skeleton layout with header, key-value detail rows, status indicators, action buttons, and related items.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DetailPanelSkeleton>;

export const Default: Story = {
  args: {
    showHeader: true,
    rows: 6,
    showActions: true,
    showRelated: false,
  },
  decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>],
};

export const WithRelatedItems: Story = {
  args: {
    showHeader: true,
    rows: 6,
    showActions: true,
    showRelated: true,
  },
  decorators: [(Story) => <div style={{ width: 450 }}><Story /></div>],
};

export const Compact: Story = {
  args: {
    showHeader: true,
    rows: 4,
    showActions: true,
    showRelated: false,
  },
  decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const Extended: Story = {
  args: {
    showHeader: true,
    rows: 10,
    showActions: true,
    showRelated: true,
  },
  decorators: [(Story) => <div style={{ width: 500 }}><Story /></div>],
};
