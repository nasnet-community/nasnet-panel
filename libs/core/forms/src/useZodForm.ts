/**
 * useZodForm Hook
 *
 * A wrapper around React Hook Form that integrates Zod schema validation.
 * Provides type-safe form handling with schema-driven validation.
 *
 * @module @nasnet/core/forms/useZodForm
 */

import { useForm, type UseFormReturn, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, z } from 'zod';

/**
 * Options for the useZodForm hook.
 */
export interface UseZodFormOptions<T extends ZodSchema>
  extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
  /** Zod schema for validation */
  schema: T;
}

/**
 * Custom hook that combines React Hook Form with Zod validation.
 *
 * @template T - Zod schema type
 * @param options - Form options including the Zod schema
 * @returns React Hook Form return object with TypeScript types inferred from schema
 *
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * function UserForm() {
 *   const form = useZodForm({
 *     schema: userSchema,
 *     defaultValues: { name: '', email: '' },
 *   });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('name')} />
 *       {form.formState.errors.name?.message}
 *     </form>
 *   );
 * }
 * ```
 */
export function useZodForm<T extends ZodSchema>(
  options: UseZodFormOptions<T>
): UseFormReturn<z.infer<T>> {
  const { schema, mode = 'onBlur', ...restOptions } = options;

  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode, // Default to onBlur for better performance
    ...restOptions,
  });
}

export default useZodForm;
