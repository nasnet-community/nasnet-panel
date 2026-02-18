/**
 * NasFormProvider Component
 *
 * A form provider that wraps React Hook Form with Zod validation
 * and integrates with the validation pipeline.
 *
 * @module @nasnet/core/forms/NasFormProvider
 */

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormProvider as RHFProvider,
  useForm,
} from 'react-hook-form';

import { mapBackendErrorsToForm } from './mapBackendErrors';
import { useValidationPipeline } from './useValidationPipeline';

import type { NasFormProviderProps, ValidationResult } from './types';
import type { ZodSchema, z } from 'zod';


/**
 * Context for accessing form-level state.
 */
interface NasFormContextValue {
  validationStrategy: 'low' | 'medium' | 'high';
  resourceUuid?: string;
  isSubmitting: boolean;
  validationResult: ValidationResult | null;
}

const NasFormContext = React.createContext<NasFormContextValue | null>(null);

/**
 * Hook to access the NasForm context.
 */
export function useNasFormContext(): NasFormContextValue {
  const context = React.useContext(NasFormContext);
  if (!context) {
    throw new Error('useNasFormContext must be used within a NasFormProvider');
  }
  return context;
}

/**
 * Form provider component that integrates React Hook Form with Zod
 * and the validation pipeline.
 *
 * @template T - Zod schema type
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
export function NasFormProvider<T extends ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  onValidationChange,
  validationStrategy = 'medium',
  resourceUuid,
  children,
}: NasFormProviderProps<T>): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationResult, setValidationResult] =
    React.useState<ValidationResult | null>(null);

  // Initialize React Hook Form with Zod resolver
  const methods = useForm<z.infer<T>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as z.infer<T>,
    mode: 'onBlur', // Validate on blur for better performance
  });

  // Initialize validation pipeline for medium/high risk
  const pipeline = useValidationPipeline({
    schema,
    strategy: validationStrategy,
    resourceUuid,
    enabled: validationStrategy !== 'low',
  });

  // Notify parent of validation changes
  React.useEffect(() => {
    if (pipeline.stages.length > 0) {
      const result: ValidationResult = {
        isValid: pipeline.isValid,
        stages: pipeline.stages,
        errors: pipeline.errors,
        conflicts: pipeline.conflicts,
      };
      setValidationResult(result);
      onValidationChange?.(result);
    }
  }, [pipeline.stages, pipeline.isValid, pipeline.errors, pipeline.conflicts, onValidationChange]);

  /**
   * Handle form submission with validation pipeline.
   */
  const handleSubmit = React.useCallback(
    async (data: z.infer<T>) => {
      setIsSubmitting(true);

      try {
        // For non-low-risk strategies, run the full validation pipeline
        if (validationStrategy !== 'low') {
          const result = await pipeline.validate(data);

          if (!result.isValid) {
            // Map backend errors to form fields
            mapBackendErrorsToForm(result.errors, methods.setError);
            setIsSubmitting(false);
            return;
          }
        }

        // All validation passed, call the onSubmit handler
        await onSubmit(data);
      } catch (error) {
        // Handle submission error
        console.error('Form submission error:', error);

        // Set a general form error
        methods.setError('root', {
          type: 'submit',
          message:
            error instanceof Error
              ? error.message
              : 'An error occurred while submitting the form',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validationStrategy, pipeline, onSubmit, methods]
  );

  // Context value
  const contextValue = React.useMemo(
    (): NasFormContextValue => ({
      validationStrategy,
      resourceUuid,
      isSubmitting,
      validationResult,
    }),
    [validationStrategy, resourceUuid, isSubmitting, validationResult]
  );

  return (
    <NasFormContext.Provider value={contextValue}>
      <RHFProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>{children}</form>
      </RHFProvider>
    </NasFormContext.Provider>
  );
}

export default NasFormProvider;
