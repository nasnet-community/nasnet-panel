import { Progress } from './progress';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const AllValues: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">0%</span>
        <Progress value={0} />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">25%</span>
        <Progress value={25} />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">50%</span>
        <Progress value={50} />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">75%</span>
        <Progress value={75} />
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">100%</span>
        <Progress value={100} />
      </div>
    </div>
  ),
};

export const DownloadProgress: Story = {
  render: () => (
    <div className="space-y-2 max-w-md">
      <div className="flex justify-between text-sm">
        <span>Downloading firmware...</span>
        <span className="text-muted-foreground">67%</span>
      </div>
      <Progress value={67} />
      <p className="text-xs text-muted-foreground">12.3 MB of 18.4 MB</p>
    </div>
  ),
};
