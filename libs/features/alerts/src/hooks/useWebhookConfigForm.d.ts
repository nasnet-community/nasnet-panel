/**
 * Headless useWebhookConfigForm Hook
 *
 * @description Manages webhook configuration form state using React Hook Form with Zod validation.
 * Provides webhook creation, testing, and signing secret display (one-time only). All callbacks
 * are memoized for stable references. Test state is cleaned up on unmount.
 *
 * @module @nasnet/features/alerts/hooks
 * @see NAS-18.4: Webhook notification configuration with Platform Presenters
 */
import { type UseFormReturn } from 'react-hook-form';
import { type Webhook } from '@nasnet/api-client/queries/notifications';
import { type WebhookConfig } from '../schemas/webhook.schema';
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
export declare function useWebhookConfigForm(options?: UseWebhookConfigFormOptions): UseWebhookConfigFormReturn;
//# sourceMappingURL=useWebhookConfigForm.d.ts.map