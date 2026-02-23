/**
 * Confidence Indicator Storybook Stories
 *
 * Demonstrates the ConfidenceIndicator component and its variants.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import { fn } from 'storybook/test';

import { Input } from '@nasnet/ui/primitives';

import {
  ConfidenceIndicator,
  ConfidenceIndicatorBase,
  ConfidenceIndicatorDot,
  useConfidenceIndicator,
} from './index';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Confidence Indicator displays a visual indicator for auto-detected values with confidence scoring.
 *
 * **Confidence Levels:**
 * - **High (Green):** 90%+ confidence - solid checkmark, strong visual signal
 * - **Medium (Amber):** 60-89% confidence - caution indicator, moderate signal
 * - **Low (Red):** <60% confidence - warning indicator, suggests manual verification
 *
 * **Features:**
 * - Three confidence levels with distinct visual styles
 * - Tooltip/sheet with detection details
 * - Override action support
 * - Platform-responsive (mobile = bottom sheet, desktop = tooltip)
 * - WCAG AAA accessible
 * - Reduced motion support
 *
 * @see ADR-018: Headless + Platform Presenters
 */
const meta: Meta<typeof ConfidenceIndicator> = {
  title: 'Patterns/ConfidenceIndicator',
  component: ConfidenceIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A visual confidence level display for auto-detected values. Shows high (green), medium (amber), or low (red) confidence with tooltip/sheet details.',
      },
    },
  },
  argTypes: {
    confidence: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Confidence percentage (0-100)',
    },
    method: {
      control: 'text',
      description: 'Detection method description',
    },
    showPercentage: {
      control: 'boolean',
      description: 'Whether to show percentage in UI',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the indicator',
    },
    variant: {
      control: 'select',
      options: ['auto', 'mobile', 'desktop'],
      description: 'Force a specific variant',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show inline label (desktop only)',
    },
    onOverride: {
      action: 'override',
      description: 'Callback when user clicks override',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfidenceIndicator>;

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * High confidence (95%) - Green checkmark indicating strong detection reliability.
 */
export const HighConfidence: Story = {
  args: {
    confidence: 95,
    method: 'Auto-detected via DHCP response',
    showPercentage: true,
    size: 'md',
    variant: 'desktop',
    onOverride: fn(),
  },
};

/**
 * Medium confidence (75%) - Amber warning indicating moderate reliability.
 */
export const MediumConfidence: Story = {
  args: {
    confidence: 75,
    method: 'Inferred from network scan',
    showPercentage: true,
    size: 'md',
    variant: 'desktop',
    onOverride: fn(),
  },
};

/**
 * Low confidence (45%) - Red warning indicating manual verification recommended.
 */
export const LowConfidence: Story = {
  args: {
    confidence: 45,
    method: 'Best guess from partial data',
    showPercentage: true,
    size: 'md',
    variant: 'desktop',
    onOverride: fn(),
  },
};

// ============================================================================
// Override Action Stories
// ============================================================================

/**
 * With override action - Shows "Edit manually" button in tooltip/sheet.
 */
export const WithOverrideAction: Story = {
  args: {
    confidence: 87,
    method: 'Auto-detected via ARP scan',
    onOverride: fn(),
    variant: 'desktop',
  },
};

/**
 * Without override action - No override button shown.
 */
export const WithoutOverrideAction: Story = {
  args: {
    confidence: 92,
    method: 'Confirmed via ICMP ping',
    variant: 'desktop',
  },
};

// ============================================================================
// Platform Variant Stories
// ============================================================================

/**
 * Mobile variant - Tap to open bottom sheet with details.
 */
export const MobileVariant: Story = {
  args: {
    confidence: 78,
    method: 'Auto-detected from router config',
    variant: 'mobile',
    onOverride: fn(),
  },
};

/**
 * Desktop variant - Hover to show tooltip with details.
 */
export const DesktopVariant: Story = {
  args: {
    confidence: 91,
    method: 'Confirmed via DNS lookup',
    variant: 'desktop',
    onOverride: fn(),
  },
};

/**
 * Desktop with inline label - Shows "High confidence" text next to indicator.
 */
export const DesktopWithLabel: Story = {
  args: {
    confidence: 96,
    method: 'Auto-detected via DHCP response',
    variant: 'desktop',
    showLabel: true,
    onOverride: fn(),
  },
};

// ============================================================================
// Size Variant Stories
// ============================================================================

/**
 * All sizes comparison - sm, md, lg variants.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground">Small</span>
        <ConfidenceIndicator confidence={95} size="sm" variant="desktop" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground">Medium</span>
        <ConfidenceIndicator confidence={95} size="md" variant="desktop" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground">Large</span>
        <ConfidenceIndicator confidence={95} size="lg" variant="desktop" />
      </div>
    </div>
  ),
};

// ============================================================================
// Theme Stories
// ============================================================================

/**
 * Dark theme - Verify colors work correctly in dark mode.
 */
export const DarkTheme: Story = {
  args: {
    confidence: 88,
    method: 'Auto-detected via DHCP',
    variant: 'desktop',
    onOverride: fn(),
  },
  decorators: [
    (Story) => (
      <div className="dark bg-slate-950 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// All Levels Comparison
// ============================================================================

/**
 * All confidence levels - Shows all three levels side by side.
 */
export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-20">High:</span>
        <ConfidenceIndicator
          confidence={95}
          method="Auto-detected via DHCP"
          variant="desktop"
          showLabel
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-20">Medium:</span>
        <ConfidenceIndicator
          confidence={75}
          method="Inferred from network scan"
          variant="desktop"
          showLabel
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-20">Low:</span>
        <ConfidenceIndicator
          confidence={45}
          method="Best guess from partial data"
          variant="desktop"
          showLabel
        />
      </div>
    </div>
  ),
};

/**
 * Boundary values - Tests exact threshold boundaries (90, 60).
 */
export const BoundaryValues: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">90% (high boundary)</span>
        <ConfidenceIndicator confidence={90} variant="desktop" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">89% (medium boundary)</span>
        <ConfidenceIndicator confidence={89} variant="desktop" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">60% (medium boundary)</span>
        <ConfidenceIndicator confidence={60} variant="desktop" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">59% (low boundary)</span>
        <ConfidenceIndicator confidence={59} variant="desktop" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">0% (minimum)</span>
        <ConfidenceIndicator confidence={0} variant="desktop" showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-32">100% (maximum)</span>
        <ConfidenceIndicator confidence={100} variant="desktop" showLabel />
      </div>
    </div>
  ),
};

// ============================================================================
// Integration Example
// ============================================================================

/**
 * With form field - Shows how the indicator integrates with an input field.
 */
export const WithFormField: Story = {
  render: () => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [value, setValue] = React.useState('192.168.1.1');

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <label htmlFor="gateway-input" className="text-sm font-medium">Default Gateway</label>
        <div className="flex items-center gap-2">
          <Input
            id="gateway-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!isEditing}
            className="flex-1"
          />
          {!isEditing && (
            <ConfidenceIndicator
              confidence={95}
              method="Auto-detected via DHCP response"
              onOverride={() => setIsEditing(true)}
              variant="desktop"
            />
          )}
          {isEditing && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">Manual entry</span>
          )}
        </div>
        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-primary underline self-start"
          >
            Revert to auto-detected value
          </button>
        )}
      </div>
    );
  },
};

// ============================================================================
// Use Cases
// ============================================================================

/**
 * Setup wizard use case - Shows typical confidence values in setup wizard context.
 */
export const SetupWizardUseCase: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[400px]">
      <h3 className="text-lg font-semibold">Network Configuration</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">WAN Connection Type</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">DHCP</span>
            <ConfidenceIndicator
              confidence={92}
              method="Auto-detected via interface probe"
              variant="desktop"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Default Gateway</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">192.168.1.1</span>
            <ConfidenceIndicator
              confidence={98}
              method="Confirmed via DHCP response"
              variant="desktop"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">DNS Servers</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">8.8.8.8, 8.8.4.4</span>
            <ConfidenceIndicator
              confidence={72}
              method="Inferred from router config"
              variant="desktop"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Router Model</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">hAP ac²</span>
            <ConfidenceIndicator
              confidence={55}
              method="Best match from fingerprint"
              variant="desktop"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Internal Components
// ============================================================================

/**
 * Base component - Shows the internal ConfidenceIndicatorBase component.
 */
export const BaseComponent: Story = {
  render: () => {
    const highState = useConfidenceIndicator({ confidence: 95 });
    const mediumState = useConfidenceIndicator({ confidence: 75 });
    const lowState = useConfidenceIndicator({ confidence: 45 });

    return (
      <div className="flex items-center gap-4">
        <ConfidenceIndicatorBase state={highState} size="md" />
        <ConfidenceIndicatorBase state={mediumState} size="md" />
        <ConfidenceIndicatorBase state={lowState} size="md" />
      </div>
    );
  },
};

/**
 * Dot variant - Shows the compact dot-only variant.
 */
export const DotVariant: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ConfidenceIndicatorDot level="high" size="sm" />
      <ConfidenceIndicatorDot level="medium" size="md" />
      <ConfidenceIndicatorDot level="low" size="lg" />
    </div>
  ),
};
