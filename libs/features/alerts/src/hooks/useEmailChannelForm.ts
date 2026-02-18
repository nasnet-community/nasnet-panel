/**
 * Headless useEmailChannelForm Hook
 *
 * Manages email channel form state using React Hook Form with Zod validation.
 * Provides multi-recipient management, TLS settings, and test functionality.
 *
 * @module @nasnet/features/alerts/hooks
 * @see NAS-18.3: Email notification configuration with Platform Presenters
 */

import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  emailConfigSchema,
  defaultEmailConfig,
  isValidEmail,
  type EmailConfig,
} from '../schemas/email-config.schema';

// ============================================================================
// Types
// ============================================================================

export interface UseEmailChannelFormOptions {
  /** Initial email configuration */
  initialConfig?: Partial<EmailConfig>;
  /** Callback when form is submitted */
  onSubmit?: (config: EmailConfig) => void | Promise<void>;
  /** Callback when test button is clicked */
  onTest?: (config: EmailConfig) => void | Promise<void>;
}

export interface UseEmailChannelFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<EmailConfig>;
  /** Current email addresses array */
  recipients: string[];
  /** Add a recipient email */
  addRecipient: (email: string) => boolean;
  /** Remove a recipient email by index */
  removeRecipient: (index: number) => void;
  /** Clear all recipients */
  clearRecipients: () => void;
  /** Is form valid */
  isValid: boolean;
  /** Handle form submission */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  /** Handle test notification */
  handleTest: () => Promise<void>;
  /** Testing state */
  isTesting: boolean;
  /** Test result */
  testResult?: { success: boolean; message: string };
  /** Clear test result */
  clearTestResult: () => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Apply SMTP port preset */
  applyPortPreset: (port: number, useTLS: boolean) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for email channel configuration form.
 *
 * Manages React Hook Form integration, validation, multi-recipient handling,
 * and test functionality.
 *
 * @example
 * ```tsx
 * const emailForm = useEmailChannelForm({
 *   initialConfig: existingConfig,
 *   onSubmit: async (config) => {
 *     await saveEmailConfig({ routerId, config });
 *   },
 *   onTest: async (config) => {
 *     await testEmailNotification({ routerId, config });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={emailForm.handleSubmit}>
 *     <Controller
 *       control={emailForm.form.control}
 *       name="fromAddress"
 *       render={({ field }) => <Input {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useEmailChannelForm(
  options: UseEmailChannelFormOptions = {}
): UseEmailChannelFormReturn {
  const { initialConfig, onSubmit: onSubmitCallback, onTest: onTestCallback } = options;

  // Initialize form with React Hook Form + Zod
  const form = useForm<EmailConfig>({
    resolver: zodResolver(emailConfigSchema) as any,
    defaultValues: {
      ...defaultEmailConfig,
      ...initialConfig,
    },
    mode: 'onChange',
  });

  const { handleSubmit: rhfHandleSubmit, setValue, watch, formState } = form;
  const { isValid } = formState;

  // Watch toAddresses for multi-recipient management
  const recipients = watch('toAddresses') || [];

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { success: boolean; message: string } | undefined
  >();

  /**
   * Add a recipient email address
   * Returns true if added successfully, false if invalid
   */
  const addRecipient = useCallback(
    (email: string): boolean => {
      const trimmedEmail = email.trim();

      // Validate email
      if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
        return false;
      }

      // Check for duplicates
      if (recipients.includes(trimmedEmail)) {
        return false;
      }

      // Check max limit
      if (recipients.length >= 10) {
        return false;
      }

      setValue('toAddresses', [...recipients, trimmedEmail], {
        shouldValidate: true,
        shouldDirty: true,
      });

      return true;
    },
    [recipients, setValue]
  );

  /**
   * Remove a recipient by index
   */
  const removeRecipient = useCallback(
    (index: number) => {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setValue('toAddresses', newRecipients, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [recipients, setValue]
  );

  /**
   * Clear all recipients
   */
  const clearRecipients = useCallback(() => {
    setValue('toAddresses', [], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  /**
   * Apply SMTP port preset (25, 587, 465)
   */
  const applyPortPreset = useCallback(
    (port: number, useTLS: boolean) => {
      setValue('port', port, { shouldValidate: true });
      setValue('useTLS', useTLS, { shouldValidate: true });
    },
    [setValue]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      await rhfHandleSubmit(async (data) => {
        if (onSubmitCallback) {
          await onSubmitCallback(data);
        }
      })(e);
    },
    [rhfHandleSubmit, onSubmitCallback]
  );

  /**
   * Handle test notification
   */
  const handleTest = useCallback(async () => {
    // Clear previous test result
    setTestResult(undefined);
    setIsTesting(true);

    try {
      const data = form.getValues();

      // Validate before testing
      const validationResult = emailConfigSchema.safeParse(data);
      if (!validationResult.success) {
        setTestResult({
          success: false,
          message: 'Please fix form errors before testing',
        });
        return;
      }

      if (onTestCallback) {
        await onTestCallback(data);
        setTestResult({
          success: true,
          message: 'Test email sent successfully! Check your inbox.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  }, [form, onTestCallback]);

  /**
   * Clear test result
   */
  const clearTestResult = useCallback(() => {
    setTestResult(undefined);
  }, []);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    form.reset({
      ...defaultEmailConfig,
      ...initialConfig,
    });
    setTestResult(undefined);
  }, [form, initialConfig]);

  return {
    form,
    recipients,
    addRecipient,
    removeRecipient,
    clearRecipients,
    isValid,
    handleSubmit,
    handleTest,
    isTesting,
    testResult,
    clearTestResult,
    reset,
    applyPortPreset,
  };
}
