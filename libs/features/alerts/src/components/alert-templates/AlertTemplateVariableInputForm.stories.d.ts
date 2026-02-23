/**
 * AlertTemplateVariableInputForm Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 */
import { AlertTemplateVariableInputForm } from './AlertTemplateVariableInputForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertTemplateVariableInputForm>;
export default meta;
type Story = StoryObj<typeof AlertTemplateVariableInputForm>;
/**
 * Default form with numeric variables (DURATION and INTEGER types)
 */
export declare const Default: Story;
/**
 * Form with mixed variable types (INTEGER, DURATION, PERCENTAGE, STRING)
 */
export declare const MixedVariableTypes: Story;
/**
 * Form with string variables only
 */
export declare const StringVariables: Story;
/**
 * Template with no variables (shows message + direct apply button)
 */
export declare const NoVariables: Story;
/**
 * Form in submitting state (buttons disabled)
 */
export declare const Submitting: Story;
/**
 * Form without cancel button
 */
export declare const NoCancel: Story;
/**
 * Form with many variables (scrollable)
 */
export declare const ManyVariables: Story;
/**
 * Form demonstrating validation errors (interactive)
 */
export declare const WithValidationErrors: Story;
//# sourceMappingURL=AlertTemplateVariableInputForm.stories.d.ts.map