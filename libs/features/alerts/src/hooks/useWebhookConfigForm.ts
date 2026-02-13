/**
 * Headless useWebhookConfigForm Hook
 *
 * Manages webhook configuration form state using React Hook Form with Zod validation.
 * Provides webhook creation, testing, and signing secret display.
 *
 * @module @nasnet/features/alerts/hooks
 * @see NAS-18.4: Webhook notification configuration with Platform Presenters
 */

import { useCallback, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCreateWebhook,
  useUpdateWebhook,
  useTestWebhook,
  type Webhook,
  type CreateWebhookInput,
} from '@nasnet/api-client/queries/notifications';
import {
  webhookConfigSchema,
  defaultWebhookConfig,
  toWebhookInput,
  type WebhookConfig,
} from '../schemas/webhook.schema';

// ============================================================================
// Types
// ============================================================================

export interface UseWebhookConfigFormOptions {
  /** Existing webhook to edit (omit for create mode) */
  webhook?: Webhook;
  /** Callback when webhook is successfully created/updated */
  onSuccess?: (webhook: Webhook, signingSecret?: string) => void | Promise<void>;
  /** Callback on error */
  onError?: (error: Error) => void | Promise<void>;
}

export interface UseWebhookConfigFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<WebhookConfig>;
  /** Is form valid */
  isValid: boolean;
  /** Handle form submission */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  /** Handle test webhook */
  handleTest: () => Promise<void>;
  /** Is submitting */
  isSubmitting: boolean;
  /** Is testing */
  isTesting: boolean;
  /** Test result */
  testResult?: {
    success: boolean;
    message: string;
    statusCode?: number;
    responseTimeMs?: number;
  };
  /** Clear test result */
  clearTestResult: () => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Is edit mode (vs create mode) */
  isEditMode: boolean;
  /** Signing secret (ONE TIME ONLY after creation) */
  signingSecret?: string;
  /** Clear signing secret (after user acknowledges) */
  clearSigningSecret: () => void;
  /** Add custom header */
  addHeader: (key: string, value: string) => void;
  /** Remove custom header */
  removeHeader: (key: string) => void;
  /** Current headers */
  headers: Record<string, string>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for webhook configuration form.
 *
 * Manages React Hook Form integration, validation, GraphQL mutations,
 * and test functionality with signing secret display.
 *
 * @example
 * ```tsx
 * const webhookForm = useWebhookConfigForm({
 *   webhook: existingWebhook, // Omit for create mode
 *   onSuccess: async (webhook, signingSecret) => {
 *     if (signingSecret) {
 *       // Show signing secret dialog (ONE TIME ONLY)
 *       showSigningSecretDialog(signingSecret);
 *     }
 *     navigate('/alerts/webhooks');
 *   }
 * });
 *
 * return (
 *   <form onSubmit={webhookForm.handleSubmit}>
 *     <Controller
 *       control={webhookForm.form.control}
 *       name="name"
 *       render={({ field }) => <Input {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useWebhookConfigForm(
  options: UseWebhookConfigFormOptions = {}
): UseWebhookConfigFormReturn {
  const { webhook, onSuccess, onError } = options;
  const isEditMode = !!webhook;

  // GraphQL mutations
  const [createWebhook, { loading: isCreating }] = useCreateWebhook();
  const [updateWebhook, { loading: isUpdating }] = useUpdateWebhook();
  const [testWebhook, { loading: isTesting }] = useTestWebhook();

  const isSubmitting = isCreating || isUpdating;

  // Initialize form with React Hook Form + Zod
  const form = useForm<WebhookConfig>({
    resolver: zodResolver(webhookConfigSchema),
    defaultValues: webhook
      ? {
          name: webhook.name,
          description: webhook.description || '',
          url: webhook.url,
          authType: webhook.authType,
          username: webhook.username || '',
          password: '', // Never populate password from server
          bearerToken: webhook.bearerToken || '',
          template: webhook.template,
          customTemplate: webhook.customTemplate || '',
          headers: webhook.headers || {},
          method: webhook.method as 'POST' | 'PUT' || 'POST',
          signingSecret: '', // Never populate from server
          timeoutSeconds: webhook.timeoutSeconds,
          retryEnabled: webhook.retryEnabled,
          maxRetries: webhook.maxRetries,
          enabled: webhook.enabled,
        }
      : defaultWebhookConfig,
    mode: 'onChange',
  });

  const { handleSubmit: rhfHandleSubmit, watch, setValue, formState } = form;
  const { isValid } = formState;

  // Watch headers for custom header management
  const headers = watch('headers') || {};

  // Test result state
  const [testResult, setTestResult] = useState<
    | {
        success: boolean;
        message: string;
        statusCode?: number;
        responseTimeMs?: number;
      }
    | undefined
  >();

  // Signing secret state (ONE TIME ONLY after creation)
  const [signingSecret, setSigningSecret] = useState<string | undefined>();

  /**
   * Add a custom header
   */
  const addHeader = useCallback(
    (key: string, value: string) => {
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (!trimmedKey || !trimmedValue) {
        return;
      }

      setValue(
        'headers',
        {
          ...headers,
          [trimmedKey]: trimmedValue,
        },
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
    },
    [headers, setValue]
  );

  /**
   * Remove a custom header
   */
  const removeHeader = useCallback(
    (key: string) => {
      const newHeaders = { ...headers };
      delete newHeaders[key];

      setValue('headers', newHeaders, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [headers, setValue]
  );

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      await rhfHandleSubmit(async (data) => {
        try {
          const input = toWebhookInput(data) as CreateWebhookInput;

          if (isEditMode && webhook) {
            // Update existing webhook
            const result = await updateWebhook({
              variables: {
                id: webhook.id,
                input,
              },
            });

            if (result.data?.updateWebhook.errors?.length) {
              const errorMessages = result.data.updateWebhook.errors
                .map((e) => e.message)
                .join(', ');
              throw new Error(errorMessages);
            }

            if (result.data?.updateWebhook.webhook) {
              await onSuccess?.(result.data.updateWebhook.webhook);
            }
          } else {
            // Create new webhook
            const result = await createWebhook({
              variables: { input },
            });

            if (result.data?.createWebhook.errors?.length) {
              const errorMessages = result.data.createWebhook.errors
                .map((e) => e.message)
                .join(', ');
              throw new Error(errorMessages);
            }

            if (result.data?.createWebhook.webhook) {
              // Extract signing secret from response (ONE TIME ONLY)
              // The backend returns it in the webhook object on creation
              const createdWebhook = result.data.createWebhook.webhook;
              const secret = data.signingSecret; // We sent it, show it to user

              if (secret) {
                setSigningSecret(secret);
              }

              await onSuccess?.(createdWebhook, secret);
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Failed to save webhook');
          await onError?.(err);
          throw err;
        }
      })(e);
    },
    [
      rhfHandleSubmit,
      isEditMode,
      webhook,
      createWebhook,
      updateWebhook,
      onSuccess,
      onError,
    ]
  );

  /**
   * Handle test webhook
   */
  const handleTest = useCallback(async () => {
    // Clear previous test result
    setTestResult(undefined);

    try {
      // For testing, we need a webhook ID
      if (!webhook?.id) {
        setTestResult({
          success: false,
          message: 'Please save the webhook before testing',
        });
        return;
      }

      const result = await testWebhook({
        variables: { id: webhook.id },
      });

      if (result.data?.testWebhook.errors?.length) {
        const errorMessages = result.data.testWebhook.errors
          .map((e) => e.message)
          .join(', ');
        setTestResult({
          success: false,
          message: errorMessages,
        });
        return;
      }

      const testData = result.data?.testWebhook.result;
      if (testData) {
        setTestResult({
          success: testData.success,
          message: testData.success
            ? `Test webhook sent successfully! (${testData.statusCode})`
            : testData.errorMessage || 'Test failed',
          statusCode: testData.statusCode,
          responseTimeMs: testData.responseTimeMs,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    }
  }, [webhook, testWebhook]);

  /**
   * Clear test result
   */
  const clearTestResult = useCallback(() => {
    setTestResult(undefined);
  }, []);

  /**
   * Clear signing secret (after user acknowledges)
   */
  const clearSigningSecret = useCallback(() => {
    setSigningSecret(undefined);
  }, []);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    form.reset(
      webhook
        ? {
            name: webhook.name,
            description: webhook.description || '',
            url: webhook.url,
            authType: webhook.authType,
            username: webhook.username || '',
            password: '',
            bearerToken: webhook.bearerToken || '',
            template: webhook.template,
            customTemplate: webhook.customTemplate || '',
            headers: webhook.headers || {},
            method: webhook.method as 'POST' | 'PUT' || 'POST',
            signingSecret: '',
            timeoutSeconds: webhook.timeoutSeconds,
            retryEnabled: webhook.retryEnabled,
            maxRetries: webhook.maxRetries,
            enabled: webhook.enabled,
          }
        : defaultWebhookConfig
    );
    setTestResult(undefined);
    setSigningSecret(undefined);
  }, [form, webhook]);

  return {
    form,
    isValid,
    handleSubmit,
    handleTest,
    isSubmitting,
    isTesting,
    testResult,
    clearTestResult,
    reset,
    isEditMode,
    signingSecret,
    clearSigningSecret,
    addHeader,
    removeHeader,
    headers,
  };
}
