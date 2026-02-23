/**
 * useConnectionTrackingSettings Hook
 *
 * Headless hook for ConnectionTrackingSettings form.
 * Provides React Hook Form + Zod schema validation.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import type { ConnectionTrackingSettings, ConnectionTrackingFormValues } from './types';
/**
 * Zod schema for connection tracking settings form
 */
declare const connectionTrackingSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    maxEntries: z.ZodEffects<z.ZodString, string, string>;
    tcpEstablishedTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpSynSentTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpSynReceivedTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpFinWaitTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpTimeWaitTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpCloseTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpCloseWaitTimeout: z.ZodEffects<z.ZodString, string, string>;
    tcpLastAckTimeout: z.ZodEffects<z.ZodString, string, string>;
    udpTimeout: z.ZodEffects<z.ZodString, string, string>;
    udpStreamTimeout: z.ZodEffects<z.ZodString, string, string>;
    icmpTimeout: z.ZodEffects<z.ZodString, string, string>;
    genericTimeout: z.ZodEffects<z.ZodString, string, string>;
    looseTracking: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    maxEntries: string;
    tcpEstablishedTimeout: string;
    tcpSynSentTimeout: string;
    tcpSynReceivedTimeout: string;
    tcpFinWaitTimeout: string;
    tcpTimeWaitTimeout: string;
    tcpCloseTimeout: string;
    tcpCloseWaitTimeout: string;
    tcpLastAckTimeout: string;
    udpTimeout: string;
    udpStreamTimeout: string;
    icmpTimeout: string;
    genericTimeout: string;
    looseTracking: boolean;
}, {
    enabled: boolean;
    maxEntries: string;
    tcpEstablishedTimeout: string;
    tcpSynSentTimeout: string;
    tcpSynReceivedTimeout: string;
    tcpFinWaitTimeout: string;
    tcpTimeWaitTimeout: string;
    tcpCloseTimeout: string;
    tcpCloseWaitTimeout: string;
    tcpLastAckTimeout: string;
    udpTimeout: string;
    udpStreamTimeout: string;
    icmpTimeout: string;
    genericTimeout: string;
    looseTracking: boolean;
}>;
export type ConnectionTrackingSchema = z.infer<typeof connectionTrackingSchema>;
export interface UseConnectionTrackingSettingsOptions {
    /** Initial settings */
    initialSettings?: ConnectionTrackingSettings;
    /** Callback when form is submitted */
    onSubmit: (settings: ConnectionTrackingSettings) => Promise<void>;
    /** Callback when form is reset */
    onReset?: () => void;
}
export interface UseConnectionTrackingSettingsReturn {
    /** React Hook Form instance */
    form: UseFormReturn<ConnectionTrackingFormValues>;
    /** Whether form has unsaved changes */
    isDirty: boolean;
    /** Whether form is submitting */
    isSubmitting: boolean;
    /** Submit handler */
    handleSubmit: () => Promise<void>;
    /** Reset handler */
    handleReset: () => void;
    /** Convert form values to settings */
    formToSettings: (values: ConnectionTrackingFormValues) => ConnectionTrackingSettings;
    /** Convert settings to form values */
    settingsToForm: (settings: ConnectionTrackingSettings) => ConnectionTrackingFormValues;
}
/**
 * Headless hook for connection tracking settings form
 *
 * @example
 * ```tsx
 * const settingsHook = useConnectionTrackingSettings({
 *   initialSettings: currentSettings,
 *   onSubmit: async (settings) => {
 *     await updateSettings(settings);
 *   },
 * });
 *
 * <FormProvider {...settingsHook.form}>
 *   <ConnectionTrackingSettings settingsHook={settingsHook} />
 * </FormProvider>
 * ```
 */
export declare function useConnectionTrackingSettings(options: UseConnectionTrackingSettingsOptions): UseConnectionTrackingSettingsReturn;
export {};
//# sourceMappingURL=use-connection-tracking-settings.d.ts.map