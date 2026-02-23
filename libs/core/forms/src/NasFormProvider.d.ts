/**
 * NasFormProvider Component
 *
 * A form provider that wraps React Hook Form with Zod validation
 * and integrates with the validation pipeline.
 *
 * @module @nasnet/core/forms/NasFormProvider
 */
import * as React from 'react';
import type { NasFormProviderProps, ValidationResult } from './types';
import type { ZodSchema } from 'zod';
/**
 * Context for accessing form-level state.
 */
interface NasFormContextValue {
    validationStrategy: 'low' | 'medium' | 'high';
    resourceUuid?: string;
    isSubmitting: boolean;
    validationResult: ValidationResult | null;
}
/**
 * Hook to access the NasForm context.
 */
export declare function useNasFormContext(): NasFormContextValue;
/**
 * Props for NasFormProvider component.
 */
interface NasFormProviderComponentProps<T extends ZodSchema> extends NasFormProviderProps<T> {
}
/**
 * Form provider component that integrates React Hook Form with Zod
 * and the validation pipeline.
 *
 * Wraps React Hook Form with automatic validation pipeline integration,
 * error handling, and context-based state sharing.
 *
 * @template T - Zod schema type
 * @param props - Component props
 * @returns Rendered form provider with children
 *
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email'),
 * });
 *
 * function UserForm() {
 *   const handleSubmit = async (data: z.infer<typeof userSchema>) => {
 *     await saveUser(data);
 *   };
 *
 *   return (
 *     <NasFormProvider
 *       schema={userSchema}
 *       defaultValues={{ name: '', email: '' }}
 *       onSubmit={handleSubmit}
 *       validationStrategy="medium"
 *     >
 *       <FormField name="name" label="Name" />
 *       <FormField name="email" label="Email" />
 *       <FormSubmitButton>Save</FormSubmitButton>
 *     </NasFormProvider>
 *   );
 * }
 * ```
 */
declare function NasFormProviderComponent<T extends ZodSchema>({ schema, defaultValues, onSubmit, onValidationChange, validationStrategy, resourceUuid, children, }: NasFormProviderComponentProps<T>): React.ReactElement;
/**
 * Memoized form provider to prevent unnecessary re-renders.
 */
export declare const NasFormProvider: typeof NasFormProviderComponent;
export {};
//# sourceMappingURL=NasFormProvider.d.ts.map