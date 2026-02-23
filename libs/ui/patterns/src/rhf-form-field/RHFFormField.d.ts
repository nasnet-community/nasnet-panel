/**
 * RHFFormField Component
 *
 * React Hook Form-integrated form field component.
 * Provides automatic error handling, accessibility, and field modes.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import * as React from 'react';
import { type ControllerRenderProps, type FieldValues, type Path } from 'react-hook-form';
/**
 * Field display modes
 */
export type FieldMode = 'editable' | 'readonly' | 'hidden' | 'computed';
export interface RHFFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
    /** Field name matching the form schema */
    name: Path<TFieldValues>;
    /** Label text */
    label: string;
    /** Help text/description */
    description?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Field display mode */
    mode?: FieldMode;
    /** Function to compute value from form values (for computed mode) */
    computeFn?: (values: TFieldValues) => string | number;
    /** Input placeholder */
    placeholder?: string;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    /** Additional CSS classes for the container */
    className?: string;
    /** Additional CSS classes for the input */
    inputClassName?: string;
    /** Custom render function for the input */
    renderInput?: (props: {
        field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
        error: string | undefined;
        fieldId: string;
        mode: FieldMode;
    }) => React.ReactNode;
    /** Children to render as the input (alternative to renderInput) */
    children?: React.ReactNode;
    /** Form control instance (optional, uses context by default) */
    control?: import('react-hook-form').Control<TFieldValues>;
    /** Pre-resolved error message */
    error?: string;
    /** Hint text shown below the field */
    hint?: string;
}
/**
 * React Hook Form-aware form field component.
 *
 * Automatically integrates with useFormContext for validation and state.
 * Supports field modes (editable, readonly, hidden, computed) for flexible
 * field display logic. Provides full WCAG AAA accessibility with proper
 * ARIA attributes and semantic HTML.
 *
 * Features:
 * - Automatic error extraction from form state
 * - Field mode support (editable, readonly, hidden, computed)
 * - Custom input rendering via renderInput prop or children
 * - Proper ARIA labels, descriptions, and validation messages
 * - Dark mode support via CSS tokens
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RHFFormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   description="We'll never share your email"
 *   required
 * />
 *
 * // With custom rendering
 * <RHFFormField
 *   name="country"
 *   label="Country"
 *   renderInput={({ field }) => (
 *     <Select {...field}>
 *       <option>USA</option>
 *       <option>Canada</option>
 *     </Select>
 *   )}
 * />
 *
 * // Computed field
 * <RHFFormField
 *   name="fullName"
 *   label="Full Name"
 *   mode="computed"
 *   computeFn={(values) => `${values.firstName} ${values.lastName}`}
 * />
 * ```
 *
 * @see {@link FieldMode} for field display modes
 */
export declare const RHFFormField: React.MemoExoticComponent<(<TFieldValues extends FieldValues = FieldValues>({ name, label, description, required, mode, computeFn, placeholder, type, className, inputClassName, renderInput, children, control: controlProp, error: errorProp, hint, }: RHFFormFieldProps<TFieldValues>) => import("react/jsx-runtime").JSX.Element | null)>;
//# sourceMappingURL=RHFFormField.d.ts.map