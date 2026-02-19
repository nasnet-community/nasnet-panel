/**
 * Storybook stories for SectionHeader
 * Reusable collapsible section header with optional badge, subtitle, icon and action button
 */

import { useState } from 'react';

import { Network, Wifi, Shield } from 'lucide-react';

import { SectionHeader } from './SectionHeader';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SectionHeader> = {
  title: 'App/Network/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A lightweight section heading used throughout the network and wifi pages. Supports an optional count badge, subtitle, icon, collapsible toggle, and an inline action button. All props are optional — the component degrades gracefully.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480, padding: '0 8px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (title only)',
  args: {
    title: 'Network Interfaces',
  },
  parameters: {
    docs: {
      description: { story: 'Minimal usage — only a title, no extras.' },
    },
  },
};

export const WithCountAndSubtitle: Story = {
  name: 'With Count Badge + Subtitle',
  args: {
    title: 'Connected Devices',
    subtitle: 'Devices seen in the ARP table',
    count: 12,
  },
  parameters: {
    docs: {
      description: {
        story: 'Count badge and subtitle below the title for contextual information.',
      },
    },
  },
};

export const WithIcon: Story = {
  name: 'With Icon',
  args: {
    title: 'Wireless Interfaces',
    count: 3,
    icon: <Wifi className="w-4 h-4" />,
  },
  parameters: {
    docs: {
      description: { story: 'An icon node rendered to the left of the title block.' },
    },
  },
};

export const WithAction: Story = {
  name: 'With Action Button',
  args: {
    title: 'Firewall Rules',
    count: 8,
    icon: <Shield className="w-4 h-4" />,
    action: {
      label: 'View all',
      onClick: () => alert('View all clicked'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'An inline action button is rendered on the right side of the header.',
      },
    },
  },
};

export const Collapsible: Story = {
  name: 'Collapsible (interactive)',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div>
        <SectionHeader
          {...args}
          isCollapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        {!collapsed && (
          <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300">
            Section content is visible when expanded.
          </div>
        )}
      </div>
    );
  },
  args: {
    title: 'ARP Table',
    count: 5,
    icon: <Network className="w-4 h-4" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `onToggle` is provided the chevron button becomes visible and clicking it collapses or expands the section.',
      },
    },
  },
};

export const CollapsedState: Story = {
  name: 'Collapsed State',
  args: {
    title: 'Route Table',
    count: 4,
    isCollapsed: true,
    onToggle: () => undefined,
  },
  parameters: {
    docs: {
      description: { story: 'Static collapsed view — chevron points right.' },
    },
  },
};
