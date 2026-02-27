/**
 * ConnectionQualityBadge Stories
 *
 * Demonstrates the connection quality badge across all quality levels,
 * sizes, and display configurations. Since the component reads from the
 * connection store via `useConnectionIndicator`, we use a mock presenter
 * approach so stories work without a live store.
 */

import * as React from 'react';

import { Signal, SignalHigh, SignalLow, SignalMedium, Zap } from 'lucide-react';

import { Badge, cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Types (mirrored from source) =====

type QualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
type SizeVariant = 'sm' | 'default' | 'lg';

// ===== Mock presenter =====
// The real component pulls quality from the Zustand connection store.
// For Storybook we accept quality + latency as direct props.

const QUALITY_COLORS: Record<QualityLevel, string> = {
  excellent: 'bg-semantic-success text-white',
  good: 'bg-semantic-success/80 text-white',
  moderate: 'bg-semantic-warning text-white',
  poor: 'bg-semantic-error text-white',
  unknown: 'bg-muted text-muted-foreground',
};

const QUALITY_LABELS: Record<QualityLevel, string> = {
  excellent: 'Excellent',
  good: 'Good',
  moderate: 'Moderate',
  poor: 'Poor',
  unknown: 'Unknown',
};

const QUALITY_VARIANTS: Record<QualityLevel, 'default' | 'secondary' | 'error' | 'outline'> = {
  excellent: 'default',
  good: 'default',
  moderate: 'secondary',
  poor: 'error',
  unknown: 'outline',
};

function QualityIcon({ quality, className }: { quality: QualityLevel; className?: string }) {
  const cls = cn('h-3.5 w-3.5', className);
  switch (quality) {
    case 'excellent':
      return <SignalHigh className={cls} />;
    case 'good':
      return <SignalMedium className={cls} />;
    case 'moderate':
      return <SignalLow className={cls} />;
    case 'poor':
      return <Signal className={cls} />;
    default:
      return <Zap className={cls} />;
  }
}

interface MockBadgeProps {
  quality?: QualityLevel;
  latencyMs?: number | null;
  showLatency?: boolean;
  showIcon?: boolean;
  size?: SizeVariant;
  className?: string;
}

function MockConnectionQualityBadge({
  quality = 'excellent',
  latencyMs = 24,
  showLatency = true,
  showIcon = true,
  size = 'default',
  className,
}: MockBadgeProps) {
  const label = QUALITY_LABELS[quality];

  const sizeClasses: Record<SizeVariant, string> = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant={QUALITY_VARIANTS[quality]}
      className={cn(
        'inline-flex items-center gap-1 font-mono',
        QUALITY_COLORS[quality],
        sizeClasses[size],
        className
      )}
      aria-label={`Connection quality: ${label}${latencyMs != null ? `, ${latencyMs}ms latency` : ''}`}
    >
      {showIcon && <QualityIcon quality={quality} />}
      {showLatency && latencyMs != null && <span>{latencyMs}ms</span>}
      {!showLatency && !showIcon && <span>{label}</span>}
    </Badge>
  );
}

// ===== Meta =====

const meta: Meta<typeof MockConnectionQualityBadge> = {
  title: 'Patterns/Connection/ConnectionQualityBadge',
  component: MockConnectionQualityBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a compact badge that summarises the current connection quality based on ' +
          'WebSocket latency. Quality is derived from latency thresholds: excellent (<50 ms), ' +
          'good (<100 ms), moderate (<200 ms), poor (≥200 ms). The live component reads from ' +
          'the Zustand connection store; these stories use an equivalent mock presenter so every ' +
          'state can be demonstrated independently.',
      },
    },
  },
  argTypes: {
    quality: {
      control: 'select',
      options: ['excellent', 'good', 'moderate', 'poor', 'unknown'],
      description: 'Connection quality level (derived from latency in the real component)',
    },
    latencyMs: {
      control: { type: 'number', min: 0, max: 1000, step: 1 },
      description: 'Latency in milliseconds to display',
    },
    showLatency: {
      control: 'boolean',
      description: 'Show the numeric latency value',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show the signal strength icon',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Badge size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockConnectionQualityBadge>;

// ===== Stories =====

/**
 * Excellent connection – latency below 50 ms. Full green badge with icon and latency.
 */
export const Excellent: Story = {
  args: {
    quality: 'excellent',
    latencyMs: 22,
    showLatency: true,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Good connection – latency in the 50–99 ms range.
 */
export const Good: Story = {
  args: {
    quality: 'good',
    latencyMs: 78,
    showLatency: true,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Moderate connection – latency in the 100–199 ms range. Rendered with amber styling.
 */
export const Moderate: Story = {
  args: {
    quality: 'moderate',
    latencyMs: 145,
    showLatency: true,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Poor connection – latency at or above 200 ms. Red badge with minimal signal icon.
 */
export const Poor: Story = {
  args: {
    quality: 'poor',
    latencyMs: 312,
    showLatency: true,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Unknown quality – latency not yet measured (null). Shown as a muted outline badge.
 */
export const Unknown: Story = {
  args: {
    quality: 'unknown',
    latencyMs: null,
    showLatency: true,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Icon-only variant – useful in space-constrained headers. Hides the latency number.
 */
export const IconOnly: Story = {
  args: {
    quality: 'excellent',
    latencyMs: 22,
    showLatency: false,
    showIcon: true,
    size: 'default',
  },
};

/**
 * Label-only variant – hides both icon and latency, showing a text quality label instead.
 */
export const LabelOnly: Story = {
  args: {
    quality: 'good',
    latencyMs: 78,
    showLatency: false,
    showIcon: false,
    size: 'default',
  },
};

/**
 * All quality levels side by side for quick visual comparison.
 */
export const AllQualityLevels: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(
        [
          { quality: 'excellent', latencyMs: 22 },
          { quality: 'good', latencyMs: 78 },
          { quality: 'moderate', latencyMs: 145 },
          { quality: 'poor', latencyMs: 312 },
          { quality: 'unknown', latencyMs: null },
        ] as const
      ).map(({ quality, latencyMs }) => (
        <MockConnectionQualityBadge
          key={quality}
          quality={quality}
          latencyMs={latencyMs}
          showLatency
          showIcon
          size="default"
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All five quality levels rendered at once for a quick visual comparison.',
      },
    },
  },
};

/**
 * Size variants – small, default, and large badges all showing the same excellent quality.
 */
export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <div
          key={size}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-muted-foreground text-xs capitalize">{size}</span>
          <MockConnectionQualityBadge
            quality="excellent"
            latencyMs={22}
            showLatency
            showIcon
            size={size}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three available size variants: `sm`, `default`, and `lg`.',
      },
    },
  },
};
