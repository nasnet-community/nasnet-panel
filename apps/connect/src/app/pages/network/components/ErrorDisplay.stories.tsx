import { fn } from 'storybook/test';

import { ErrorDisplay } from './ErrorDisplay';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ErrorDisplay> = {
  title: 'App/Network/ErrorDisplay',
  component: ErrorDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-page error state shown when network data fails to load. Renders a centred alert icon, a human-readable error message, and an optional "Try Again" retry button.',
      },
    },
  },
  argTypes: {
    onRetry: { action: 'retried' },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorDisplay>;

export const Default: Story = {
  name: 'Default (with Retry)',
  args: {
    error: new Error('Unable to fetch network interfaces from the router.'),
    onRetry: fn(),
  },
};

export const WithoutRetry: Story = {
  name: 'Without Retry Button',
  args: {
    error: new Error('Unable to fetch network interfaces from the router.'),
  },
};

export const NetworkTimeout: Story = {
  name: 'Network Timeout',
  args: {
    error: new Error('Request timed out after 30 seconds. Check router connectivity.'),
    onRetry: fn(),
  },
};

export const AuthenticationError: Story = {
  name: 'Authentication Error',
  args: {
    error: new Error('Authentication failed: invalid credentials for 192.168.88.1.'),
    onRetry: fn(),
  },
};

export const GenericError: Story = {
  name: 'Generic / Unknown Error',
  args: {
    error: new Error(''),
    onRetry: fn(),
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
