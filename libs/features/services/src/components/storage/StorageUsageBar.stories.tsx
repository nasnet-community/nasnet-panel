/**
 * StorageUsageBar Storybook Stories
 *
 * Visual documentation for the StorageUsageBar component.
 * Demonstrates all threshold states, BigInt formatting, and edge cases.
 *
 * @see NAS-8.20: External Storage Management
 */

import { StorageUsageBar } from './StorageUsageBar';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StorageUsageBar> = {
  title: 'Features/Services/Storage/StorageUsageBar',
  component: StorageUsageBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A visual progress bar that shows storage usage with color-coded thresholds.

**Threshold Colours:**
- Green (\`bg-success\`) — usage below 80%
- Amber (\`bg-warning\`) — usage 80–89%
- Red (\`bg-error\`) — usage 90%+ or \`showWarning=true\`

**Features:**
- BigInt formatting for precision with very large byte values (>2 GB)
- Free-bytes derived automatically when not provided
- Accessible with \`role="progressbar"\` and ARIA attributes
- Smooth CSS transition on bar width changes
        `.trim(),
      },
    },
  },
  argTypes: {
    usagePercent: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Usage percentage (0–100)',
    },
    showWarning: {
      control: 'boolean',
      description: 'Force red/warning styling regardless of percentage',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StorageUsageBar>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 16 GB total, variable used */
const GB16 = (16 * 1024 * 1024 * 1024).toString();
const usedBytes = (percent: number) => Math.round((parseInt(GB16, 10) * percent) / 100).toString();

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Healthy usage — below 80%. Bar is green.
 */
export const Healthy: Story = {
  args: {
    usagePercent: 42,
    totalBytes: GB16,
    usedBytes: usedBytes(42),
  },
};

/**
 * Warning zone — 80–89%. Bar turns amber to alert the user.
 */
export const WarningThreshold: Story = {
  args: {
    usagePercent: 84,
    totalBytes: GB16,
    usedBytes: usedBytes(84),
  },
};

/**
 * Critical usage — 90%+. Bar turns red.
 */
export const Critical: Story = {
  args: {
    usagePercent: 93,
    totalBytes: GB16,
    usedBytes: usedBytes(93),
  },
};

/**
 * Completely full — 100%. Useful for checking that the bar doesn't overflow.
 */
export const Full: Story = {
  args: {
    usagePercent: 100,
    totalBytes: GB16,
    usedBytes: GB16,
  },
};

/**
 * Force warning styling via prop even when usage is low.
 * Used when the storage device is disconnected / unavailable.
 */
export const ForcedWarning: Story = {
  args: {
    usagePercent: 35,
    totalBytes: GB16,
    usedBytes: usedBytes(35),
    showWarning: true,
  },
};

/**
 * Provide explicit freeBytes instead of letting the component calculate it.
 */
export const ExplicitFreeBytes: Story = {
  args: {
    usagePercent: 60,
    totalBytes: GB16,
    usedBytes: usedBytes(60),
    freeBytes: usedBytes(40),
  },
};

/**
 * Very small flash storage — 32 MB total.
 * Demonstrates byte-level formatting for MikroTik onboard flash.
 */
export const SmallFlashStorage: Story = {
  args: {
    usagePercent: 78,
    totalBytes: (32 * 1024 * 1024).toString(),
    usedBytes: Math.round(32 * 1024 * 1024 * 0.78).toString(),
  },
};

/**
 * All threshold states side-by-side for quick visual comparison.
 */
export const AllThresholds: Story = {
  render: () => (
    <div className="max-w-lg space-y-6">
      {(
        [
          { label: 'Healthy (42%)', percent: 42 },
          { label: 'Warning (84%)', percent: 84 },
          { label: 'Critical (93%)', percent: 93 },
          { label: 'Full (100%)', percent: 100 },
        ] as const
      ).map(({ label, percent }) => (
        <div key={label}>
          <p className="text-muted-foreground mb-2 text-sm font-medium">{label}</p>
          <StorageUsageBar
            usagePercent={percent}
            totalBytes={GB16}
            usedBytes={usedBytes(percent)}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison view of all three threshold colour states.',
      },
    },
  },
};
