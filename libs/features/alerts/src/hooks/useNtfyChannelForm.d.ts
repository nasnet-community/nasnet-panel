/**
 * Headless useNtfyChannelForm Hook
 *
 * @description Manages ntfy.sh channel form state using React Hook Form with Zod validation.
 * Provides tag management, priority presets, and test functionality. All callbacks are memoized
 * for stable references across re-renders.
 *
 * @module @nasnet/features/alerts/hooks
 * @see NAS-18.X: Ntfy.sh notification configuration with Platform Presenters
 */
import { type UseFormReturn } from 'react-hook-form';
import { type NtfyConfig } from '../schemas/ntfy-config.schema';
export interface UseNtfyChannelFormOptions {
    /** Initial ntfy configuration */
    initialConfig?: Partial<NtfyConfig>;
    /** Callback when form is submitted */
    onSubmit?: (config: NtfyConfig) => void | Promise<void>;
    /** Callback when test button is clicked */
    onTest?: (config: NtfyConfig) => void | Promise<void>;
}
export interface UseNtfyChannelFormReturn {
    /** React Hook Form instance */
    form: UseFormReturn<NtfyConfig>;
    /** Current tags array */
    tags: string[];
    /** Add a tag */
    addTag: (tag: string) => boolean;
    /** Remove a tag by index */
    removeTag: (index: number) => void;
    /** Clear all tags */
    clearTags: () => void;
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
    /** Apply priority preset */
    applyPriorityPreset: (priority: number) => void;
    /** Apply server URL preset */
    applyServerPreset: (serverUrl: string) => void;
    /** Whether authentication is enabled */
    hasAuthentication: boolean;
    /** Toggle authentication */
    toggleAuthentication: (enabled: boolean) => void;
}
/**
 * Headless hook for ntfy.sh channel configuration form.
 *
 * Manages React Hook Form integration, validation, tag handling,
 * and test functionality.
 *
 * @example
 * ```tsx
 * const ntfyForm = useNtfyChannelForm({
 *   initialConfig: existingConfig,
 *   onSubmit: async (config) => {
 *     await saveNtfyConfig({ routerId, config });
 *   },
 *   onTest: async (config) => {
 *     await testNtfyNotification({ routerId, config });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={ntfyForm.handleSubmit}>
 *     <Controller
 *       control={ntfyForm.form.control}
 *       name="topic"
 *       render={({ field }) => <Input {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export declare function useNtfyChannelForm(options?: UseNtfyChannelFormOptions): UseNtfyChannelFormReturn;
//# sourceMappingURL=useNtfyChannelForm.d.ts.map