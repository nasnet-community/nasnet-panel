/**
 * Headless useEmailChannelForm Hook
 *
 * @description Manages email channel form state using React Hook Form with
 * Zod validation. Provides multi-recipient management, TLS settings, test
 * functionality, and SMTP port presets. All handlers use useCallback for
 * stable references and cleanup occurs on unmount.
 *
 * @module @nasnet/features/alerts/hooks
 * @see NAS-18.3: Email notification configuration with Platform Presenters
 */
import { type UseFormReturn } from 'react-hook-form';
import { type EmailConfig } from '../schemas/email-config.schema';
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
    testResult?: {
        success: boolean;
        message: string;
    };
    /** Clear test result */
    clearTestResult: () => void;
    /** Reset form to initial state */
    reset: () => void;
    /** Apply SMTP port preset */
    applyPortPreset: (port: number, useTLS: boolean) => void;
}
/**
 * Headless hook for email channel configuration form.
 *
 * @description Manages React Hook Form integration with Zod validation,
 * multi-recipient handling, test functionality, and SMTP presets. Cleanup
 * occurs on unmount. All handlers are memoized with useCallback.
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
export declare function useEmailChannelForm(options?: UseEmailChannelFormOptions): UseEmailChannelFormReturn;
//# sourceMappingURL=useEmailChannelForm.d.ts.map