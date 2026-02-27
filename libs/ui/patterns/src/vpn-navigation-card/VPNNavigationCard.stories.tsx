import { VPNNavigationCard } from './VPNNavigationCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNNavigationCard> = {
  title: 'Patterns/VPNNavigationCard',
  component: VPNNavigationCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A clickable navigation card for the VPN dashboard that links to the VPN Servers or VPN Clients management page. Uses a gradient background, a type-specific icon, and prominently displays the configured and active counts.',
      },
    },
  },
  argTypes: {
    type: { control: 'radio', options: ['server', 'client'] },
    count: { control: 'number' },
    activeCount: { control: 'number' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNNavigationCard>;

export const ServerCard: Story = {
  args: {
    type: 'server',
    count: 4,
    activeCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN Servers navigation card using the Trust Blue (secondary) colour scheme with the Server icon.',
      },
    },
  },
};

export const ClientCard: Story = {
  args: {
    type: 'client',
    count: 6,
    activeCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN Clients navigation card using the Golden Amber (primary) colour scheme with the Monitor icon.',
      },
    },
  },
};

export const AllConfiguredNoneActive: Story = {
  args: {
    type: 'server',
    count: 3,
    activeCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three servers configured but none currently active — the active count shows 0 in the success green.',
      },
    },
  },
};

export const NoneConfigured: Story = {
  args: {
    type: 'client',
    count: 0,
    activeCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state — no clients configured yet. Both counters show 0.',
      },
    },
  },
};

export const SideBySide: Story = {
  render: (args) => (
    <div className="grid w-[520px] grid-cols-2 gap-4">
      <VPNNavigationCard
        type="server"
        count={4}
        activeCount={3}
        onClick={args.onClick}
      />
      <VPNNavigationCard
        type="client"
        count={6}
        activeCount={2}
        onClick={args.onClick}
      />
    </div>
  ),
  args: {},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Both navigation cards rendered side by side as they appear in the VPN dashboard grid, making the colour contrast between server (blue) and client (amber) apparent.',
      },
    },
  },
};

export const SingleItemSingular: Story = {
  args: {
    type: 'server',
    count: 1,
    activeCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single server configured and active — verifies singular/plural display logic.',
      },
    },
  },
};
