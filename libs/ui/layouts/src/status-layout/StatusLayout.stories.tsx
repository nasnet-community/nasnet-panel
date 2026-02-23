import { StatusLayout } from './status-layout';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StatusLayout> = {
  title: 'Layouts/StatusLayout',
  component: StatusLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A sticky status/alert banner for displaying temporary status messages. Uses semantic colors (success/warning/error/info) and supports optional dismissal.',
      },
    },
  },
  argTypes: {
    children: { control: 'text' },
    status: {
      control: 'radio',
      options: ['success', 'warning', 'error', 'info'],
    },
    visible: { control: 'boolean' },
    sticky: { control: 'boolean' },
    onDismiss: { action: 'dismissed' },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof StatusLayout>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    children: 'This is an informational status message.',
    status: 'info',
    visible: true,
    sticky: true,
  },
};

export const Success: Story = {
  args: {
    children: 'Configuration saved successfully!',
    status: 'success',
    visible: true,
    sticky: true,
  },
};

export const Warning: Story = {
  args: {
    children:
      'Interface Ether1 is degraded. Performance may be affected. Check the cable connection.',
    status: 'warning',
    visible: true,
    sticky: true,
  },
};

export const Error: Story = {
  args: {
    children:
      'Configuration failed: Access denied. Please check your permissions and try again.',
    status: 'error',
    visible: true,
    sticky: true,
  },
};

export const WithDismissButton: Story = {
  args: {
    children: 'New software update available. Restart the application to apply.',
    status: 'info',
    visible: true,
    sticky: true,
    onDismiss: () => {
      /* dismiss handler */
    },
  },
};

export const Floating: Story = {
  name: 'Floating (Not Sticky)',
  args: {
    children: 'This banner will scroll with the page.',
    status: 'warning',
    visible: true,
    sticky: false,
  },
};

export const LongMessage: Story = {
  args: {
    children:
      'Configuration validation completed with warnings: 2 firewall rules may conflict with existing policies. Review the rules in the Firewall section before applying.',
    status: 'warning',
    visible: true,
    sticky: true,
    onDismiss: () => {
      /* dismiss handler */
    },
  },
};

export const MobileView: Story = {
  name: 'Mobile (375px)',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    children: 'Status: Configuration updated successfully.',
    status: 'success',
    visible: true,
    sticky: true,
    onDismiss: () => {
      /* dismiss handler */
    },
  },
};

export const TabletView: Story = {
  name: 'Tablet (768px)',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    children: 'Status: Waiting for router response...',
    status: 'info',
    visible: true,
    sticky: true,
  },
};

export const DesktopView: Story = {
  name: 'Desktop (1280px)',
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    children: 'Status: Critical update available. Please update within 24 hours.',
    status: 'error',
    visible: true,
    sticky: true,
    onDismiss: () => {
      /* dismiss handler */
    },
  },
};
