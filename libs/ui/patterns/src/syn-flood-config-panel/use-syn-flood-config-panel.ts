/**
 * useSynFloodConfigPanel Hook
 *
 * Headless hook for SynFloodConfigPanel form.
 * Provides React Hook Form + Zod schema validation.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { DEFAULT_SYN_FLOOD_CONFIG } from '@nasnet/core/types';

import type { SynFloodConfig, SynFloodFormValues } from './types';

// Re-export for consumers
export type { SynFloodFormValues };

/**
 * Zod schema for SYN flood config form
 */
const synFloodConfigSchema = z
  .object({
    enabled: z.boolean(),
    synLimit: z
      .string()
      .min(1, 'SYN limit is required')
      .refine(
        (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 1 && num <= 10000;
        },
        { message: 'Must be between 1 and 10,000' }
      ),
    burst: z
      .string()
      .min(1, 'Burst is required')
      .refine(
        (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 1 && num <= 1000;
        },
        { message: 'Must be between 1 and 1,000' }
      ),
    action: z.enum(['drop', 'tarpit']),
  })
  .refine(
    (data) => {
      const burst = parseInt(data.burst, 10);
      const synLimit = parseInt(data.synLimit, 10);
      return burst <= synLimit;
    },
    {
      message: 'Burst must be less than or equal to SYN limit',
      path: ['burst'],
    }
  );

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
 * Convert config to form values
 */
function configToForm(config: SynFloodConfig): SynFloodFormValues {
  return {
    enabled: config.isEnabled,
    synLimit: String(config.synLimit),
    burst: String(config.burst),
    action: config.action,
  };
}

/**
 * Convert form values to config
 */
function formToConfig(values: SynFloodFormValues): SynFloodConfig {
  return {
    isEnabled: values.enabled,
    synLimit: parseInt(values.synLimit, 10),
    burst: parseInt(values.burst, 10),
    action: values.action,
  };
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
export function useSynFloodConfigPanel(
  options: UseSynFloodConfigPanelOptions
): UseSynFloodConfigPanelReturn {
  const { initialConfig, onSubmit, onReset } = options;

  // Initialize form with default values
  const defaultValues =
    initialConfig ? configToForm(initialConfig) : configToForm(DEFAULT_SYN_FLOOD_CONFIG);

  const form = useForm<SynFloodFormValues>({
    resolver: zodResolver(synFloodConfigSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { formState, reset, handleSubmit: rhfHandleSubmit } = form;

  // Submit handler
  const handleSubmit = useCallback(async () => {
    await rhfHandleSubmit(async (values) => {
      const config = formToConfig(values);
      await onSubmit(config);
    })();
  }, [rhfHandleSubmit, onSubmit]);

  // Reset handler
  const handleReset = useCallback(() => {
    reset(defaultValues);
    onReset?.();
  }, [reset, defaultValues, onReset]);

  // Check if SYN limit is low
  const isLowSynLimit = useCallback(() => {
    const synLimit = parseInt(form.getValues('synLimit'), 10);
    return !isNaN(synLimit) && synLimit < 100;
  }, [form]);

  return {
    form,
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    handleSubmit,
    handleReset,
    formToConfig,
    configToForm,
    isLowSynLimit,
  };
}
