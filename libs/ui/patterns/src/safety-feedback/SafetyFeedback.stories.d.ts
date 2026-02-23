/**
 * SafetyFeedback Stories
 *
 * Demonstrates the SafetyFeedback component across all feedback types,
 * with and without action buttons, short and long detail text, and
 * the auto-dismiss behaviour.
 */
import { SafetyFeedback } from './SafetyFeedback';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SafetyFeedback>;
export default meta;
type Story = StoryObj<typeof SafetyFeedback>;
/**
 * Success feedback – configuration applied without issues.
 */
export declare const Success: Story;
/**
 * Warning feedback – non-blocking issue that the user should be aware of.
 */
export declare const Warning: Story;
/**
 * Rollback feedback – a dangerous operation was automatically reversed after verification failed.
 */
export declare const Rollback: Story;
/**
 * Validation error feedback – the configuration did not pass pre-apply validation.
 */
export declare const ValidationError: Story;
/**
 * No details – minimal variant with just a headline and no action buttons.
 */
export declare const Minimal: Story;
/**
 * Long detail text – details exceeding 100 characters render behind a Show Details toggle.
 */
export declare const LongDetails: Story;
/**
 * Auto-dismiss – success banner that disappears after 4 seconds.
 */
export declare const AutoDismiss: Story;
/**
 * Multiple action buttons – shows how two or more actions render side by side.
 */
export declare const MultipleActions: Story;
/**
 * All types side by side for a quick visual overview.
 */
export declare const AllTypes: Story;
//# sourceMappingURL=SafetyFeedback.stories.d.ts.map