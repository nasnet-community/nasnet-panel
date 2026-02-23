/**
 * Form Primitives
 *
 * Low-level composable form building blocks based on React Hook Form + Radix UI Label.
 * Use these primitives within ConfigForm or ResourceForm pattern components.
 *
 * Architecture:
 * - Form: Root wrapper (FormProvider from react-hook-form)
 * - FormField: Controller wrapper for individual field management
 * - FormItem: Container for label, control, description, and error message
 * - FormLabel: Semantic label element with error styling
 * - FormControl: Wrapper for input elements with ARIA attributes
 * - FormDescription: Helper text below input
 * - FormMessage: Error message display (auto-populated from validation)
 *
 * State Management:
 * - All state managed by React Hook Form (passed to Form)
 * - useFormField() hook extracts field context and validation state
 * - FormMessage auto-displays error.message from field state
 *
 * Accessibility:
 * - ARIA id linking: label -> control -> description/error
 * - aria-describedby connects input to description AND error
 * - aria-invalid set based on field error state
 * - Semantic <label> element (not just styling)
 *
 * Usage Pattern:
 * ```tsx
 * const form = useForm({ resolver: zodResolver(schema) });
 *
 * <Form {...form}>
 *   <FormField
 *     control={form.control}
 *     name="email"
 *     render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Email</FormLabel>
 *         <FormControl>
 *           <Input {...field} placeholder="you@example.com" />
 *         </FormControl>
 *         <FormDescription>We'll never share your email.</FormDescription>
 *         <FormMessage />
 *       </FormItem>
 *     )}
 *   />
 * </Form>
 * ```
 *
 * @see https://react-hook-form.com/
 * @see https://www.radix-ui.com/docs/primitives/components/label
 */
import * as React from 'react';
import { type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import type * as LabelPrimitive from '@radix-ui/react-label';
/**
 * Form root wrapper (re-exports FormProvider from react-hook-form).
 * Wraps entire form to provide form context to child fields.
 *
 * @example
 * ```tsx
 * const form = useForm({ resolver: zodResolver(schema) });
 * <Form {...form}>
 *   <Form FieldChild />
 * </Form>
 * ```
 */
declare const Form: <TFieldValues extends FieldValues, TContext = any, TTransformedValues = TFieldValues>(props: import("react-hook-form").FormProviderProps<TFieldValues, TContext, TTransformedValues>) => React.JSX.Element;
/**
 * Form Field Controller
 *
 * Wraps react-hook-form Controller to manage a single field's state and validation.
 * Must be used within a Form component.
 *
 * Generic Types:
 * - TFieldValues: Shape of form data
 * - TName: Path to field within form data (type-safe)
 *
 * Props: Standard ControllerProps from react-hook-form
 * - control: Form control object from useForm()
 * - name: Field path (e.g., 'address.street')
 * - render: Render function receiving field state
 * - rules: Validation rules (or use Zod schema + resolver)
 *
 * @example
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="username"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Username</FormLabel>
 *       <FormControl>
 *         <Input {...field} />
 *       </FormControl>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 * ```
 */
declare const FormField: <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => import("react/jsx-runtime").JSX.Element;
/**
 * Use Form Field Hook
 *
 * Extracts field context, validation state, and ARIA IDs for form primitives.
 * Must be used within a FormField -> FormItem tree.
 *
 * Returns:
 * - id: Unique FormItem ID (used for ARIA linking)
 * - name: Field name/path
 * - formItemId: ID for main form item div
 * - formDescriptionId: ID for description element
 * - formMessageId: ID for error message element
 * - ...fieldState: From react-hook-form (invalid, isDirty, isTouched, error, etc.)
 *
 * Throws: Error if used outside FormField context
 *
 * @example
 * ```tsx
 * function MyFormItem() {
 *   const { error, formItemId } = useFormField();
 *   return <input id={formItemId} aria-invalid={!!error} />;
 * }
 * ```
 */
declare const useFormField: () => {
    invalid: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
    error?: import("react-hook-form").FieldError;
    id: string;
    name: string;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
};
/**
 * Form Item Container
 *
 * Wraps label, control, description, and error message for a single form field.
 * Generates unique ID and provides it via context to child elements.
 *
 * Layout: Vertical flex with space-y-2 (8px gap) between children
 * - FormLabel
 * - FormControl (input)
 * - FormDescription (optional helper text)
 * - FormMessage (optional error message)
 *
 * Props: Standard HTML div attributes
 *
 * Memoized for performance (prevents re-render unless children change)
 *
 * @example
 * ```tsx
 * <FormItem>
 *   <FormLabel>Email</FormLabel>
 *   <FormControl>
 *     <Input />
 *   </FormControl>
 *   <FormDescription>Helper text</FormDescription>
 *   <FormMessage />
 * </FormItem>
 * ```
 */
declare const FormItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
/**
 * Form Label
 *
 * Semantic <label> element linked to input via formItemId.
 * Automatically turns red (text-destructive) if field has validation error.
 *
 * Props: Standard label attributes
 * - htmlFor: Auto-linked to input (set via useFormField)
 * - className: Additional CSS classes
 *
 * Styling:
 * - Default: inherits text color
 * - Error state: text-destructive (red) for visual feedback
 * - No special styling needed (theme applies via semantic tokens)
 *
 * Accessibility:
 * - Semantic <label> improves screen reader experience
 * - Links to input via htmlFor (click to focus input)
 * - Error color provides visual status indicator
 *
 * Memoized for performance
 *
 * @example
 * ```tsx
 * <FormLabel>Email Address</FormLabel>
 * ```
 */
declare const FormLabel: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & React.RefAttributes<HTMLLabelElement>>>;
/**
 * Form Control (Input Wrapper)
 *
 * Wraps input elements with ARIA attributes for accessibility.
 * Uses Radix Slot pattern to avoid div wrapper around actual input.
 *
 * Props: asChild pattern (pass your Input/Textarea/Select as children)
 *
 * ARIA Attributes (auto-set):
 * - id: Links to label via htmlFor
 * - aria-describedby: Links to description AND error message
 * - aria-invalid: true if field has error (screen reader announces invalid state)
 *
 * Smart aria-describedby:
 * - No error: only description ID
 * - Has error: both description and error IDs (screen reader reads both)
 *
 * Usage Pattern:
 * ```tsx
 * <FormControl>
 *   <Input placeholder="..." />
 * </FormControl>
 * ```
 *
 * Not:
 * ```tsx
 * <FormControl>
 *   <input placeholder="..." />
 * </FormControl>
 * ```
 *
 * Memoized for performance
 *
 * @see https://www.radix-ui.com/docs/primitives/utilities/slot
 */
declare const FormControl: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<import("@radix-ui/react-slot").SlotProps & React.RefAttributes<HTMLElement>, "ref"> & React.RefAttributes<HTMLElement>>>;
/**
 * Form Description
 *
 * Helper text displayed below input (optional).
 * Linked to input via aria-describedby for screen readers.
 *
 * Props: Standard paragraph attributes
 *
 * Styling:
 * - Size: 0.8rem (12px) for secondary importance
 * - Color: muted-foreground (gray) for visual hierarchy
 *
 * Accessibility:
 * - aria-describedby links input to this element
 * - Screen readers announce description when input focused
 * - Helps users understand requirements or context
 *
 * Usage:
 * - Explain what the field is for ("e.g., name@example.com")
 * - List requirements ("8-16 characters")
 * - Show helper text ("Case sensitive")
 *
 * Memoized for performance
 *
 * @example
 * ```tsx
 * <FormDescription>
 *   Must be a valid email address. We'll never share it.
 * </FormDescription>
 * ```
 */
declare const FormDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>>;
/**
 * Form Message (Error Display)
 *
 * Displays validation error message below input.
 * Auto-populated from field error state (or pass children manually).
 *
 * Props: Standard paragraph attributes
 *
 * Behavior:
 * - Renders null if no error and no children
 * - Shows error.message from react-hook-form if available
 * - Falls back to children if passed explicitly
 *
 * Styling:
 * - Size: 0.8rem (12px)
 * - Weight: font-medium (500)
 * - Color: text-destructive (red) for error state
 *
 * Accessibility:
 * - aria-describedby links input to this element
 * - Screen readers announce error when input focused
 * - Specific error messages (not generic "Invalid input")
 * - Only shows when error exists (reduces noise)
 *
 * Integration with react-hook-form:
 * - Automatically reads error.message from field state
 * - No manual error passing needed
 * - Just use <FormMessage /> with no props
 *
 * Memoized for performance
 *
 * @example
 * ```tsx
 * // Auto-display error from react-hook-form
 * <FormMessage />
 *
 * // Or pass custom message
 * <FormMessage>Custom error text</FormMessage>
 * ```
 */
declare const FormMessage: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>>;
export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
//# sourceMappingURL=index.d.ts.map