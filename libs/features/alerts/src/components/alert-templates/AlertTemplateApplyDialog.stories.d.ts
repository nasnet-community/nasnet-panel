/**
 * AlertTemplateApplyDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases the apply dialog workflow:
 * - Loading state (template fetching skeleton)
 * - Template with variables (full form)
 * - Template without variables (simplified form)
 * - Applying/submitting state
 * - Error state (failed to load template)
 */
import { AlertTemplateApplyDialog } from './AlertTemplateApplyDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertTemplateApplyDialog>;
export default meta;
type Story = StoryObj<typeof AlertTemplateApplyDialog>;
/**
 * Default — dialog opened for a template that has one variable.
 * Shows the dynamic form with a duration input field and a preview section.
 */
export declare const Default: Story;
/**
 * Loading — simulates the skeleton state while the template is being fetched.
 */
export declare const Loading: Story;
/**
 * No Variables — template that requires no configuration.
 * The variable section is hidden and the form only shows customization fields.
 */
export declare const NoVariables: Story;
/**
 * Multiple Variables — security template requiring two inputs.
 */
export declare const MultipleVariables: Story;
/**
 * Error state — shown when the template cannot be loaded.
 */
export declare const TemplateLoadError: Story;
/**
 * Closed — dialog is mounted but not visible (open=false).
 */
export declare const Closed: Story;
//# sourceMappingURL=AlertTemplateApplyDialog.stories.d.ts.map