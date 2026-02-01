import { Badge } from './badge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'connected', 'warning', 'error', 'info', 'offline', 'outline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="connected">Connected</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="offline">Offline</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="connected">Connected</Badge>
        <span className="text-sm text-muted-foreground">Server is online and responding</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Pending</Badge>
        <span className="text-sm text-muted-foreground">Connection is being established</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error">Failed</Badge>
        <span className="text-sm text-muted-foreground">Connection could not be established</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="offline">Offline</Badge>
        <span className="text-sm text-muted-foreground">Server is not responding</span>
      </div>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="success" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-green-600" />
        Online
      </Badge>
      <Badge variant="error" className="gap-1">
        <span className="h-2 w-2 rounded-full bg-red-600" />
        Offline
      </Badge>
    </div>
  ),
};
