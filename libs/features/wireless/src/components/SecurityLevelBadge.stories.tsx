/**
 * SecurityLevelBadge Stories
 *
 * Covers all four security levels defined by the SecurityLevel type:
 * strong, moderate, weak, and none. An additional story shows all four
 * badges rendered side-by-side to allow quick visual comparison.
 */

import { SecurityLevelBadge } from './SecurityLevelBadge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SecurityLevelBadge> = {
  title: 'Features/Wireless/SecurityLevelBadge',
  component: SecurityLevelBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact pill badge that communicates the security strength of a wireless ' +
          'network at a glance. Uses color-coded backgrounds and a matching Lucide ' +
          'shield icon: green for Strong (WPA2/WPA3 + AES), yellow for Moderate ' +
          '(WPA with mixed ciphers), red for Weak (WEP/TKIP), and gray for None ' +
          '(open network). Includes an aria-label for screen reader accessibility.',
      },
    },
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['strong', 'moderate', 'weak', 'none'],
      description: 'Security strength level to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SecurityLevelBadge>;

// ---------------------------------------------------------------------------
// Individual level stories
// ---------------------------------------------------------------------------

export const Strong: Story = {
  name: 'Strong (WPA2/WPA3 + AES)',
  args: {
    level: 'strong',
  },
};

export const Moderate: Story = {
  name: 'Moderate (WPA + mixed ciphers)',
  args: {
    level: 'moderate',
  },
};

export const Weak: Story = {
  name: 'Weak (WEP / TKIP only)',
  args: {
    level: 'weak',
  },
};

export const None: Story = {
  name: 'None (Open Network)',
  args: {
    level: 'none',
  },
};

// ---------------------------------------------------------------------------
// Comparison story — all four levels side-by-side
// ---------------------------------------------------------------------------

export const AllLevels: Story = {
  name: 'All Levels — Comparison',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <SecurityLevelBadge level="strong" />
      <SecurityLevelBadge level="moderate" />
      <SecurityLevelBadge level="weak" />
      <SecurityLevelBadge level="none" />
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Custom className override story
// ---------------------------------------------------------------------------

export const CustomSize: Story = {
  name: 'Custom className — Larger Text',
  args: {
    level: 'strong',
    className: 'text-sm px-3 py-1.5',
  },
};
