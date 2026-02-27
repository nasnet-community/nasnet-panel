import { StatusIndicator } from './status-indicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Patterns/Common/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component:
          'A compact inline status indicator with a colored dot and optional label. Supports five semantic statuses (online, offline, warning, info, pending), three sizes, and an optional pulse animation for live states.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'offline', 'warning', 'info', 'pending'],
      description: 'Semantic status variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dot and text',
    },
    label: {
      control: 'text',
      description: 'Optional text label shown next to the dot',
    },
    showDot: {
      control: 'boolean',
      description: 'Whether to show the coloured status dot',
    },
    pulse: {
      control: 'boolean',
      description: 'Animate the dot with a pulsing glow (useful for live/active states)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusIndicator>;

// ─── Individual status stories ────────────────────────────────────────────────

export const Default: Story = {
  args: {
    status: 'online',
    label: 'Online',
    size: 'md',
    showDot: true,
    pulse: false,
  },
};

export const Online: Story = {
  args: {
    status: 'online',
    label: 'Online',
    size: 'md',
    showDot: true,
    pulse: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Online state with the pulse animation enabled — useful for live/active indicators.',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    status: 'offline',
    label: 'Offline',
    size: 'md',
    showDot: true,
    pulse: false,
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    label: 'Degraded',
    size: 'md',
    showDot: true,
    pulse: false,
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
    label: 'Connecting…',
    size: 'md',
    showDot: true,
    pulse: false,
  },
};

export const Info: Story = {
  args: {
    status: 'info',
    label: 'Syncing',
    size: 'md',
    showDot: true,
    pulse: false,
  },
};

// ─── Size variants ─────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatusIndicator
        status="online"
        label="Small"
        size="sm"
        showDot
      />
      <StatusIndicator
        status="online"
        label="Medium"
        size="md"
        showDot
      />
      <StatusIndicator
        status="online"
        label="Large"
        size="lg"
        showDot
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All three size variants side-by-side: sm (xs text + 1.5×1.5 dot), md (sm text + 2×2 dot), lg (base text + 3×3 dot).',
      },
    },
  },
};

// ─── Dot-only (no label) ───────────────────────────────────────────────────

export const DotOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusIndicator
        status="online"
        size="md"
        showDot
      />
      <StatusIndicator
        status="offline"
        size="md"
        showDot
      />
      <StatusIndicator
        status="warning"
        size="md"
        showDot
      />
      <StatusIndicator
        status="info"
        size="md"
        showDot
      />
      <StatusIndicator
        status="pending"
        size="md"
        showDot
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dot-only mode — no label text. Useful for table cells or tight layouts.',
      },
    },
  },
};

// ─── All statuses at a glance ──────────────────────────────────────────────

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <StatusIndicator
        status="online"
        label="Online"
        size="md"
        showDot
      />
      <StatusIndicator
        status="offline"
        label="Offline"
        size="md"
        showDot
      />
      <StatusIndicator
        status="warning"
        label="Degraded"
        size="md"
        showDot
      />
      <StatusIndicator
        status="info"
        label="Info"
        size="md"
        showDot
      />
      <StatusIndicator
        status="pending"
        label="Pending"
        size="md"
        showDot
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All five semantic statuses rendered together for a visual token reference.',
      },
    },
  },
};
