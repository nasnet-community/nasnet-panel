/**
 * UndoFloatingButton Storybook Stories
 *
 * Interactive stories for the floating rollback countdown button.
 * Demonstrates urgency states, dialog interactions, and timer behavior.
 *
 * @module @nasnet/features/firewall
 */
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
declare const meta: Meta<typeof UndoFloatingButton>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default (Normal Urgency)
 *
 * Fresh countdown at 5:00 — normal urgency. Button uses default variant.
 * The countdown badge has a card border with neutral colors.
 */
export declare const Default: Story;
/**
 * With Many Rules Applied
 *
 * Template that applied 18 rules. The confirmation dialog shows
 * "18 firewall rules will be removed" to help the user understand the impact.
 */
export declare const ManyRulesApplied: Story;
/**
 * Single Rule Applied
 *
 * Edge case with exactly 1 rule. The dialog should use the singular
 * "1 firewall rule" (no trailing "s").
 */
export declare const SingleRuleApplied: Story;
/**
 * Rolling Back In Progress
 *
 * isRollingBack=true disables the button and changes its label to "Rolling back...".
 * This state is shown after the user confirms rollback in the dialog.
 */
export declare const RollingBackInProgress: Story;
/**
 * Zero Rules Applied
 *
 * Edge case where the template applied 0 rules.
 * The confirmation dialog still renders but shows "0 firewall rules created".
 */
export declare const ZeroRulesApplied: Story;
/**
 * Rollback Confirmed (Async Handler)
 *
 * Demonstrates a slow onRollback callback (2s delay).
 * After clicking "Confirm Rollback", the dialog closes and isRollingBack
 * should be managed by the parent (TemplateApplyFlow machine).
 */
export declare const SlowRollback: Story;
//# sourceMappingURL=UndoFloatingButton.stories.d.ts.map