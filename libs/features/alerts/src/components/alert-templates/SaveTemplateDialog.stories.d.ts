/**
 * SaveTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the SaveTemplateDialog component for saving
 * alert rules as reusable templates.
 */
import { SaveTemplateDialog } from './SaveTemplateDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SaveTemplateDialog>;
export default meta;
type Story = StoryObj<typeof SaveTemplateDialog>;
/**
 * Default state with a device offline alert rule pre-filled in the form.
 */
export declare const Default: Story;
/**
 * Dialog with a high CPU alert rule demonstrating different severity and conditions.
 */
export declare const WithHighCPURule: Story;
/**
 * Loading state when saving the template (shows disabled submit button).
 */
export declare const Loading: Story;
//# sourceMappingURL=SaveTemplateDialog.stories.d.ts.map