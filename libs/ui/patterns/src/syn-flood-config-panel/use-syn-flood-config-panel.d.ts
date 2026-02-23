/**
 * useSynFloodConfigPanel Hook
 *
 * Headless hook for SynFloodConfigPanel form.
 * Provides React Hook Form + Zod schema validation.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import type { SynFloodConfig, SynFloodFormValues } from './types';
export type { SynFloodFormValues };
/**
 * Zod schema for SYN flood config form
 */
declare const synFloodConfigSchema: z.ZodEffects<z.ZodObject<{
    enabled: z.ZodBoolean;
    synLimit: z.ZodEffects<z.ZodString, string, string>;
    burst: z.ZodEffects<z.ZodString, string, string>;
    action: z.ZodEnum<["drop", "tarpit"]>;
}, "strip", z.ZodTypeAny, {
    action: "drop" | "tarpit";
    enabled: boolean;
    burst: string;
    synLimit: string;
}, {
    action: "drop" | "tarpit";
    enabled: boolean;
    burst: string;
    synLimit: string;
}>, {
    action: "drop" | "tarpit";
    enabled: boolean;
    burst: string;
    synLimit: string;
}, {
    action: "drop" | "tarpit";
    enabled: boolean;
    burst: string;
    synLimit: string;
}>;
export type SynFloodConfigSchema = z.infer<typeof synFloodConfigSchema>;
export interface UseSynFloodConfigPanelOptions {
    /** Initial config */
    initialConfig?: SynFloodConfig;
    /** Callback when form is submitted */
    onSubmit: (config: SynFloodConfig) => Promise<void>;
    /** Callback when form is reset */
    onReset?: () => void;
}
export interface UseSynFloodConfigPanelReturn {
    /** React Hook Form instance */
    form: UseFormReturn<SynFloodFormValues>;
    /** Whether form has unsaved changes */
    isDirty: boolean;
    /** Whether form is submitting */
    isSubmitting: boolean;
    /** Submit handler */
    handleSubmit: () => Promise<void>;
    /** Reset handler */
    handleReset: () => void;
    /** Convert form values to config */
    formToConfig: (values: SynFloodFormValues) => SynFloodConfig;
    /** Convert config to form values */
    configToForm: (config: SynFloodConfig) => SynFloodFormValues;
    /** Check if SYN limit is low (< 100) */
    isLowSynLimit: () => boolean;
}
/**
 * Headless hook for SYN flood config panel
 *
 * @example
 * ```tsx
 * const configHook = useSynFloodConfigPanel({
 *   initialConfig: currentConfig,
 *   onSubmit: async (config) => {
 *     await updateConfig(config);
 *   },
 * });
 *
 * <FormProvider {...configHook.form}>
 *   <SynFloodConfigPanel configHook={configHook} />
 * </FormProvider>
 * ```
 */
export declare function useSynFloodConfigPanel(options: UseSynFloodConfigPanelOptions): UseSynFloodConfigPanelReturn;
//# sourceMappingURL=use-syn-flood-config-panel.d.ts.map