/**
 * FormSubmitButton Stories
 *
 * Storybook stories for the FormSubmitButton component.
 * Demonstrates idle, submitting, disabled, and disableOnInvalid states
 * within real React Hook Form contexts.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import { FormSubmitButton } from './FormSubmitButton';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * FormSubmitButton
 *
 * A submit button that integrates with React Hook Form's context. It reads
 * `formState.isSubmitting` and `formState.isValid` from the nearest
 * `<FormProvider>` to automatically manage its disabled state and show a
 * spinner during async submission.
 *
 * ## Behaviour
 *
 * | Condition | Button state |
 * |-----------|-------------|
 * | Normal idle | Enabled, renders `children` |
 * | `isSubmitting === true` | Disabled, shows Loader2 spinner + `loadingText` |
 * | `disabled` prop is `true` | Disabled unconditionally |
 * | `disableOnInvalid && !isValid` | Disabled when form has validation errors |
 *
 * ## Usage
 *
 * ```tsx
 * <FormProvider {...methods}>
 *   <form onSubmit={methods.handleSubmit(onSubmit)}>
 *     <FormSubmitButton loadingText="Saving..." disableOnInvalid>
 *       Save Configuration
 *     </FormSubmitButton>
 *   </form>
 * </FormProvider>
 * ```
 *
 * Must be rendered inside a `<FormProvider>` tree.
 */
declare const meta: Meta<typeof FormSubmitButton>;
export default meta;
type Story = StoryObj<typeof FormSubmitButton>;
/**
 * Default
 *
 * Idle submit button inside a valid form. The button is enabled and renders
 * its children label with no spinner.
 */
export declare const Default: Story;
/**
 * With Custom Loading Text
 *
 * Demonstrates that `loadingText` replaces the spinner label during submission.
 * Trigger submission in the canvas to see the transition.
 */
export declare const CustomLoadingText: Story;
/**
 * Disabled on Invalid
 *
 * The button is disabled until all form fields satisfy the Zod schema.
 * Type at least 3 characters in the name field to enable the button.
 */
export declare const DisabledOnInvalid: Story;
/**
 * Explicitly Disabled
 *
 * The `disabled` prop is set to true unconditionally, regardless of form state.
 * Useful for guards based on external conditions (e.g., missing permissions).
 */
export declare const ExplicitlyDisabled: Story;
/**
 * Destructive Variant
 *
 * Submit button styled with the destructive variant for dangerous operations
 * such as factory reset or bulk deletion.
 */
export declare const DestructiveVariant: Story;
/**
 * All Sizes
 *
 * Renders the button at each available size for visual comparison.
 */
export declare const AllSizes: Story;
//# sourceMappingURL=FormSubmitButton.stories.d.ts.map