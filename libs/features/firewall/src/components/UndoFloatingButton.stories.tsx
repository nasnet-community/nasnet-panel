/**
 * UndoFloatingButton Storybook Stories
 *
 * Interactive stories for the floating rollback countdown button.
 * Demonstrates urgency states, dialog interactions, and timer behavior.
 *
 * @module @nasnet/features/firewall
 */

import { fn } from 'storybook/test';

import { UndoFloatingButton } from './UndoFloatingButton';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * UndoFloatingButton - Floating countdown button for template rollback
 *
 * Appears after a firewall template is successfully applied, giving the operator
 * a 5-minute window to undo all created rules via a single click.
 *
 * ## Countdown Urgency Levels
 *
 * The button and countdown badge change visual style based on time remaining:
 *
 * | Remaining Time | Urgency | Badge Style | Button Variant |
 * |----------------|---------|-------------|----------------|
 * | > 60 seconds | `normal` | Card border | `default` |
 * | 31–60 seconds | `warning` | Amber background | `default` |
 * | 0–30 seconds | `critical` | Destructive red | `destructive` |
 *
 * ## Layout
 *
 * Fixed-position at `bottom-6 right-6 z-50`. Renders two elements:
 * 1. A countdown badge (MM:SS format + Progress bar)
 * 2. The "Undo Changes" button (44px min-height, shadow-lg)
 *
 * ## Confirmation Dialog
 *
 * Clicking "Undo Changes" opens a Dialog (not immediate rollback). The dialog shows:
 * - Template name and rule count
 * - A warning alert explaining what will be removed
 * - Time remaining
 * - "Keep Changes" (cancel) and "Confirm Rollback" (destructive) buttons
 *
 * ## Auto-Hide
 *
 * The component hides itself (returns null) when the countdown reaches 0.
 * The `onExpire` callback is fired at that point.
 *
 * ## Accessibility
 *
 * - Countdown badge has `role="status"` and `aria-live="polite"`
 * - Button has descriptive `aria-label`
 * - Minimum 44px touch targets on all interactive elements
 *
 * ## Usage
 *
 * ```tsx
 * import { UndoFloatingButton } from '@nasnet/features/firewall';
 *
 * {applyResult?.rollbackId && (
 *   <UndoFloatingButton
 *     onRollback={async () => {
 *       await executeRollback({ routerId, rollbackId: applyResult.rollbackId });
 *     }}
 *     onExpire={() => machine.send({ type: 'RESET' })}
 *     templateName="Basic Home Security"
 *     rulesApplied={5}
 *   />
 * )}
 * ```
 */
const meta: Meta<typeof UndoFloatingButton> = {
  title: 'Features/Firewall/UndoFloatingButton',
  component: UndoFloatingButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Floating countdown button providing a 5-minute rollback window after template application. Urgency styling escalates from normal → warning (60s) → critical (30s). Clicking opens a confirmation dialog before executing rollback.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  decorators: [
    (Story) => (
      // Provide a tall container so the fixed-position button is visible
      <div style={{ minHeight: '400px', position: 'relative', background: 'hsl(var(--background))' }}>
        <div style={{ padding: '24px', color: 'hsl(var(--muted-foreground))' }}>
          <p style={{ fontSize: '14px' }}>Firewall template applied successfully.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>The rollback button is fixed bottom-right.</p>
        </div>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onRollback: {
      description: 'Async callback invoked when the user confirms rollback in the dialog.',
      table: { type: { summary: '() => Promise<void>' } },
    },
    onExpire: {
      description: 'Callback invoked when the 5-minute countdown reaches zero and the button hides.',
      table: { type: { summary: '() => void' } },
    },
    isRollingBack: {
      control: 'boolean',
      description: 'Shows "Rolling back..." label and disables the button while rollback is in progress.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    templateName: {
      control: 'text',
      description: 'Template name shown in the confirmation dialog.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'template'" },
      },
    },
    rulesApplied: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of firewall rules that were applied, shown in the confirmation dialog.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default (Normal Urgency)
 *
 * Fresh countdown at 5:00 — normal urgency. Button uses default variant.
 * The countdown badge has a card border with neutral colors.
 */
export const Default: Story = {
  args: {
    onRollback: fn().mockResolvedValue(undefined),
    onExpire: fn(),
    templateName: 'Basic Home Security',
    rulesApplied: 5,
    isRollingBack: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state at 5:00 remaining. Normal urgency — neutral card badge, default button variant. Countdown ticks every second. Click "Undo Changes" to open the confirmation dialog.',
      },
    },
  },
};

/**
 * With Many Rules Applied
 *
 * Template that applied 18 rules. The confirmation dialog shows
 * "18 firewall rules will be removed" to help the user understand the impact.
 */
export const ManyRulesApplied: Story = {
  args: {
    onRollback: fn().mockResolvedValue(undefined),
    onExpire: fn(),
    templateName: 'Advanced VPN Security Suite',
    rulesApplied: 18,
    isRollingBack: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Template applied 18 rules. The confirmation dialog reflects this count: "All 18 firewall rules will be removed." Tests plural form handling.',
      },
    },
  },
};

/**
 * Single Rule Applied
 *
 * Edge case with exactly 1 rule. The dialog should use the singular
 * "1 firewall rule" (no trailing "s").
 */
export const SingleRuleApplied: Story = {
  args: {
    onRollback: fn().mockResolvedValue(undefined),
    onExpire: fn(),
    templateName: 'Quick Masquerade',
    rulesApplied: 1,
    isRollingBack: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: exactly 1 rule applied. The confirmation dialog renders "1 firewall rule created" (singular). Template name is "Quick Masquerade".',
      },
    },
  },
};

/**
 * Rolling Back In Progress
 *
 * isRollingBack=true disables the button and changes its label to "Rolling back...".
 * This state is shown after the user confirms rollback in the dialog.
 */
export const RollingBackInProgress: Story = {
  args: {
    onRollback: fn().mockResolvedValue(undefined),
    onExpire: fn(),
    templateName: 'Basic Home Security',
    rulesApplied: 5,
    isRollingBack: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'isRollingBack=true — button is disabled and shows "Rolling back..." label. Both the main button and the dialog\'s Confirm Rollback button are disabled in this state.',
      },
    },
  },
};

/**
 * Zero Rules Applied
 *
 * Edge case where the template applied 0 rules.
 * The confirmation dialog still renders but shows "0 firewall rules created".
 */
export const ZeroRulesApplied: Story = {
  args: {
    onRollback: fn().mockResolvedValue(undefined),
    onExpire: fn(),
    templateName: 'Empty Template',
    rulesApplied: 0,
    isRollingBack: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: 0 rules applied. Renders the button normally — the rollback window still exists even if no rules were created (the apply result may still be reversible).',
      },
    },
  },
};

/**
 * Rollback Confirmed (Async Handler)
 *
 * Demonstrates a slow onRollback callback (2s delay).
 * After clicking "Confirm Rollback", the dialog closes and isRollingBack
 * should be managed by the parent (TemplateApplyFlow machine).
 */
export const SlowRollback: Story = {
  args: {
    onRollback: fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 2000))
    ),
    onExpire: fn(),
    templateName: 'Basic Home Security',
    rulesApplied: 5,
    isRollingBack: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'onRollback introduces a 2-second delay (simulates slow API). Click "Undo Changes" → "Confirm Rollback" to observe the async behavior. In production, the XState machine transitions to the rollingBack state.',
      },
    },
  },
};
