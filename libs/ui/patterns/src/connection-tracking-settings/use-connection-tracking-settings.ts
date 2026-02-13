/**
 * useConnectionTrackingSettings Hook
 *
 * Headless hook for ConnectionTrackingSettings form.
 * Provides React Hook Form + Zod schema validation.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback } from 'react';

import {
  parseDuration,
  formatDuration,
  isValidDuration,
  parseOrDefault,
} from './timeout-utils';
import type {
  ConnectionTrackingSettings,
  ConnectionTrackingFormValues,
} from './types';
import { DEFAULT_SETTINGS } from './types';

/**
 * Zod schema for connection tracking settings form
 */
const connectionTrackingSchema = z.object({
  enabled: z.boolean(),
  maxEntries: z
    .string()
    .min(1, 'Max entries is required')
    .refine(
      (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0 && num <= 10000000;
      },
      { message: 'Must be between 1 and 10,000,000' }
    ),

  // TCP timeouts
  tcpEstablishedTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, {
      message: 'Invalid format (use 1d, 12h, 30m, or 45s)',
    }),
  tcpSynSentTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpSynReceivedTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpFinWaitTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpTimeWaitTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpCloseTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpCloseWaitTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  tcpLastAckTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),

  // Other protocols
  udpTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  udpStreamTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  icmpTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),
  genericTimeout: z
    .string()
    .min(1, 'Required')
    .refine(isValidDuration, { message: 'Invalid format' }),

  // Options
  looseTracking: z.boolean(),
});

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
 * Convert settings to form values
 */
function settingsToForm(
  settings: ConnectionTrackingSettings
): ConnectionTrackingFormValues {
  return {
    enabled: settings.enabled,
    maxEntries: String(settings.maxEntries),
    genericTimeout: formatDuration(settings.genericTimeout),
    tcpEstablishedTimeout: formatDuration(settings.tcpEstablishedTimeout),
    tcpTimeWaitTimeout: formatDuration(settings.tcpTimeWaitTimeout),
    tcpCloseTimeout: formatDuration(settings.tcpCloseTimeout),
    tcpSynSentTimeout: formatDuration(settings.tcpSynSentTimeout),
    tcpSynReceivedTimeout: formatDuration(settings.tcpSynReceivedTimeout),
    tcpFinWaitTimeout: formatDuration(settings.tcpFinWaitTimeout),
    tcpCloseWaitTimeout: formatDuration(settings.tcpCloseWaitTimeout),
    tcpLastAckTimeout: formatDuration(settings.tcpLastAckTimeout),
    udpTimeout: formatDuration(settings.udpTimeout),
    udpStreamTimeout: formatDuration(settings.udpStreamTimeout),
    icmpTimeout: formatDuration(settings.icmpTimeout),
    looseTracking: settings.looseTracking,
  };
}

/**
 * Convert form values to settings
 */
function formToSettings(
  values: ConnectionTrackingFormValues
): ConnectionTrackingSettings {
  return {
    enabled: values.enabled,
    maxEntries: parseInt(values.maxEntries, 10),
    genericTimeout: parseOrDefault(values.genericTimeout, DEFAULT_SETTINGS.genericTimeout),
    tcpEstablishedTimeout: parseOrDefault(values.tcpEstablishedTimeout, DEFAULT_SETTINGS.tcpEstablishedTimeout),
    tcpTimeWaitTimeout: parseOrDefault(values.tcpTimeWaitTimeout, DEFAULT_SETTINGS.tcpTimeWaitTimeout),
    tcpCloseTimeout: parseOrDefault(values.tcpCloseTimeout, DEFAULT_SETTINGS.tcpCloseTimeout),
    tcpSynSentTimeout: parseOrDefault(values.tcpSynSentTimeout, DEFAULT_SETTINGS.tcpSynSentTimeout),
    tcpSynReceivedTimeout: parseOrDefault(values.tcpSynReceivedTimeout, DEFAULT_SETTINGS.tcpSynReceivedTimeout),
    tcpFinWaitTimeout: parseOrDefault(values.tcpFinWaitTimeout, DEFAULT_SETTINGS.tcpFinWaitTimeout),
    tcpCloseWaitTimeout: parseOrDefault(values.tcpCloseWaitTimeout, DEFAULT_SETTINGS.tcpCloseWaitTimeout),
    tcpLastAckTimeout: parseOrDefault(values.tcpLastAckTimeout, DEFAULT_SETTINGS.tcpLastAckTimeout),
    udpTimeout: parseOrDefault(values.udpTimeout, DEFAULT_SETTINGS.udpTimeout),
    udpStreamTimeout: parseOrDefault(values.udpStreamTimeout, DEFAULT_SETTINGS.udpStreamTimeout),
    icmpTimeout: parseOrDefault(values.icmpTimeout, DEFAULT_SETTINGS.icmpTimeout),
    looseTracking: values.looseTracking,
  };
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
export function useConnectionTrackingSettings(
  options: UseConnectionTrackingSettingsOptions
): UseConnectionTrackingSettingsReturn {
  const { initialSettings, onSubmit, onReset } = options;

  // Initialize form with default values
  const defaultValues = initialSettings
    ? settingsToForm(initialSettings)
    : settingsToForm(DEFAULT_SETTINGS);

  const form = useForm<ConnectionTrackingFormValues>({
    resolver: zodResolver(connectionTrackingSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { formState, reset, handleSubmit: rhfHandleSubmit } = form;

  // Submit handler
  const handleSubmit = useCallback(async () => {
    await rhfHandleSubmit(async (values) => {
      const settings = formToSettings(values);
      await onSubmit(settings);
    })();
  }, [rhfHandleSubmit, onSubmit]);

  // Reset handler
  const handleReset = useCallback(() => {
    reset(defaultValues);
    onReset?.();
  }, [reset, defaultValues, onReset]);

  return {
    form,
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    handleSubmit,
    handleReset,
    formToSettings,
    settingsToForm,
  };
}
