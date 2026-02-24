/**
 * Storybook stories for SaveTemplateDialog
 *
 * Demonstrates the dialog for saving current firewall rules as a reusable template.
 * Covers: empty rule set, rules with detectable variables (IP, subnet, interface, port),
 * name-conflict validation, saving state, and controlled open/close mode.
 */
import { SaveTemplateDialog } from './SaveTemplateDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SaveTemplateDialog>;
export default meta;
type Story = StoryObj<typeof SaveTemplateDialog>;
/**
 * Default — dialog triggered by a button, two simple rules, no existing names.
 */
export declare const Default: Story;
/**
 * Rules with rich variable candidates — IP, subnet, interface, and port are detected.
 */
export declare const WithVariableCandidates: Story;
/**
 * Single rule — tests singular form of the dialog description ("1 firewall rule").
 */
export declare const SingleRule: Story;
/**
 * Saving state — simulates the 1-second async save delay to show the spinner.
 */
export declare const SavingInProgress: Story;
/**
 * Save failure — the onSave callback rejects, triggering the destructive Alert.
 */
export declare const SaveFailure: Story;
/**
 * Controlled closed state — dialog is closed by the parent, only the trigger renders.
 */
export declare const ControlledClosed: Story;
//# sourceMappingURL=SaveTemplateDialog.stories.d.ts.map