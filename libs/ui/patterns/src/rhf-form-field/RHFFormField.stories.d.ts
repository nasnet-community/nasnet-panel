/**
 * RHFFormField Stories
 *
 * Storybook stories for React Hook Form integrated field components.
 */
import { FormArrayField } from './FormArrayField';
import { FormFieldDescription } from './FormFieldDescription';
import { FormFieldError } from './FormFieldError';
import { FormSubmitButton } from './FormSubmitButton';
import { RHFFormField } from './RHFFormField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RHFFormField>;
export default meta;
type Story = StoryObj<typeof RHFFormField>;
/**
 * Basic text field
 */
export declare const Default: Story;
/**
 * Required field with indicator
 */
export declare const Required: Story;
/**
 * With description text
 */
export declare const WithDescription: Story;
/**
 * Readonly mode
 */
export declare const ReadonlyMode: Story;
/**
 * Computed field mode
 */
export declare const ComputedMode: Story;
/**
 * Standalone error message
 */
export declare const ErrorMessage: StoryObj<typeof FormFieldError>;
/**
 * No error (renders nothing)
 */
export declare const NoError: StoryObj<typeof FormFieldError>;
/**
 * Help text description
 */
export declare const DescriptionText: StoryObj<typeof FormFieldDescription>;
/**
 * Submit button states
 */
export declare const SubmitButtonStates: StoryObj<typeof FormSubmitButton>;
/**
 * Dynamic array field for peers
 */
export declare const ArrayField: StoryObj<typeof FormArrayField>;
/**
 * Complete form example
 */
export declare const CompleteForm: Story;
//# sourceMappingURL=RHFFormField.stories.d.ts.map