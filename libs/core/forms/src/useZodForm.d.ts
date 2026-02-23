/**
 * useZodForm Hook
 *
 * A wrapper around React Hook Form that integrates Zod schema validation.
 * Provides type-safe form handling with schema-driven validation.
 *
 * @module @nasnet/core/forms/useZodForm
 */
import { type UseFormReturn, type UseFormProps } from 'react-hook-form';
import type { ZodSchema, z } from 'zod';
/**
 * Options for the useZodForm hook.
 *
 * Extends React Hook Form options while requiring a Zod schema
 * for type-safe validation.
 *
 * @template T - Zod schema type that must be a ZodSchema
 *
 * @example
 * ```tsx
 * const schema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1),
 * });
 *
 * type Options = UseZodFormOptions<typeof schema>;
 * ```
 */
export interface UseZodFormOptions<T extends ZodSchema> extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
    /** Zod schema used for form validation */
    readonly schema: T;
}
/**
 * Custom hook that combines React Hook Form with Zod validation.
 *
 * Integrates Zod schema validation with React Hook Form's state management
 * and field handling. Automatically infers types from the schema and provides
 * full type safety for form fields and validation errors.
 *
 * @template T - Zod schema type that must extend ZodSchema
 * @param options - Form options including the required Zod schema
 * @returns React Hook Form return object with TypeScript types inferred from schema
 *
 * @example
 * ```tsx
 * import { z } from 'zod';
 * import { useZodForm } from '@nasnet/core/forms';
 *
 * const userSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email address'),
 *   isSubscribed: z.boolean().default(false),
 * });
 *
 * function UserForm() {
 *   const form = useZodForm({
 *     schema: userSchema,
 *     defaultValues: { name: '', email: '', isSubscribed: false },
 *     mode: 'onBlur',
 *   });
 *
 *   const handleSubmit = form.handleSubmit((data) => {
 *     console.log('Form data:', data);
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input {...form.register('name')} placeholder="Name" />
 *       {form.formState.errors.name && (
 *         <span>{form.formState.errors.name.message}</span>
 *       )}
 *       <input {...form.register('email')} placeholder="Email" />
 *       {form.formState.errors.email && (
 *         <span>{form.formState.errors.email.message}</span>
 *       )}
 *       <input type="checkbox" {...form.register('isSubscribed')} />
 *       <button type="submit" disabled={form.formState.isSubmitting}>
 *         Submit
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export declare function useZodForm<T extends ZodSchema>(options: UseZodFormOptions<T>): UseFormReturn<z.infer<T>>;
//# sourceMappingURL=useZodForm.d.ts.map