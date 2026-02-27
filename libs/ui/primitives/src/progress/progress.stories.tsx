import { Progress } from './progress';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A progress bar component for showing operation progress, file uploads, or percentages. Built on Radix UI Progress with full accessibility support and smooth animations. Supports custom max values and ARIA labels. Provides visual feedback with semantic color (primary green for completion).',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The current progress value (0-100 by default)',
    },
    max: {
      control: { type: 'number' },
      description: 'The maximum progress value',
    },
    'aria-label': {
      control: { type: 'text' },
      description: 'Accessible label describing the progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default progress bar at 60% completion.',
      },
    },
  },
  args: {
    value: 60,
  },
};

export const AllValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows all key progress values from 0% (empty) to 100% (complete). Demonstrates visual progression.',
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-4">
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">0%</span>
        <Progress
          value={0}
          aria-label="0% progress"
        />
      </div>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">25%</span>
        <Progress
          value={25}
          aria-label="25% progress"
        />
      </div>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">50%</span>
        <Progress
          value={50}
          aria-label="50% progress"
        />
      </div>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">75%</span>
        <Progress
          value={75}
          aria-label="75% progress"
        />
      </div>
      <div className="space-y-1">
        <span className="text-muted-foreground text-sm">100%</span>
        <Progress
          value={100}
          aria-label="100% progress"
        />
      </div>
    </div>
  ),
};

export const DownloadProgress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example showing firmware download progress with context label and size information.',
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-2">
      <div className="flex justify-between text-sm">
        <span>Downloading firmware...</span>
        <span className="text-muted-foreground">67%</span>
      </div>
      <Progress
        value={67}
        aria-label="Firmware download progress: 67%"
      />
      <p className="text-muted-foreground text-xs">12.3 MB of 18.4 MB</p>
    </div>
  ),
};

export const InstallProgress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Service installation progress showing partial completion (45%) with status message.',
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Installing Tor service...</span>
          <span className="text-muted-foreground">45%</span>
        </div>
        <Progress
          value={45}
          aria-label="Service installation: 45%"
        />
      </div>
      <p className="text-muted-foreground text-xs">Extracting files...</p>
    </div>
  ),
};

export const UpdateProgress: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'System update progress with warning message. Shows 82% completion with safety guidance.',
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>System update in progress</span>
          <span className="text-muted-foreground">82%</span>
        </div>
        <Progress
          value={82}
          aria-label="System update: 82%"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Do not power off the router. Time remaining: 1 minute
      </p>
    </div>
  ),
};

export const CompletedState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Progress bar at 100% completion. Shows full bar state with success context.',
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Backup completed</span>
          <span className="text-success">100%</span>
        </div>
        <Progress
          value={100}
          aria-label="Backup completed: 100%"
        />
      </div>
      <p className="text-muted-foreground text-xs">Configuration backup saved successfully</p>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Progress bar on mobile viewport (375px). Shows backup operation with responsive layout.',
      },
    },
  },
  render: () => (
    <div className="max-w-sm space-y-4 p-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">Backup in progress</span>
        <Progress
          value={58}
          aria-label="Backup progress: 58%"
        />
        <p className="text-muted-foreground text-xs">Backing up configuration...</p>
      </div>
    </div>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Progress bar on tablet viewport (768px). Shows WireGuard configuration sync at 91% completion.',
      },
    },
  },
  render: () => (
    <div className="max-w-lg space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>WireGuard Configuration Sync</span>
          <span className="text-muted-foreground">91%</span>
        </div>
        <Progress
          value={91}
          aria-label="Configuration sync: 91%"
        />
      </div>
    </div>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Progress bar on desktop viewport (1280px). Shows multi-step operation with detailed information.',
      },
    },
  },
  render: () => (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Full System Backup</span>
          <span className="text-muted-foreground">Step 2 of 4 (48%)</span>
        </div>
        <Progress
          value={48}
          aria-label="Full system backup: Step 2 of 4, 48% complete"
        />
        <div className="text-muted-foreground grid grid-cols-4 gap-2 text-xs">
          <div>Configuration: ✓</div>
          <div>Database: Syncing...</div>
          <div>Logs: Pending</div>
          <div>Archive: Pending</div>
        </div>
      </div>
    </div>
  ),
};
