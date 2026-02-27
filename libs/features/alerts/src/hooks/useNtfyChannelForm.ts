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

import { useCallback, useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ntfyConfigSchema,
  DEFAULT_NTFY_CONFIG,
  isValidNtfyTopic,
  parseNtfyTags,
  type NtfyConfig,
} from '../schemas/ntfy-config.schema';

// ============================================================================
// Types
// ============================================================================

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
  testResult?: { success: boolean; message: string };
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

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useNtfyChannelForm(
  options: UseNtfyChannelFormOptions = {}
): UseNtfyChannelFormReturn {
  const { initialConfig, onSubmit: onSubmitCallback, onTest: onTestCallback } = options;

  // Initialize form with React Hook Form + Zod
  const form = useForm<NtfyConfig>({
    resolver: zodResolver(ntfyConfigSchema) as any,
    defaultValues: {
      ...DEFAULT_NTFY_CONFIG,
      ...initialConfig,
    },
    mode: 'onChange',
  });

  const { handleSubmit: rhfHandleSubmit, setValue, watch, formState, reset: rhfReset } = form;
  const { isValid } = formState;

  // Watch tags and authentication fields
  const tags = watch('tags') || [];
  const username = watch('username');
  const password = watch('password');

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | undefined>();

  /**
   * Check if authentication is enabled
   */
  const hasAuthentication = Boolean(
    username && username.trim().length > 0 && password && password.trim().length > 0
  );

  /**
   * Add a tag
   * Returns true if added successfully, false if invalid
   */
  const addTag = useCallback(
    (tag: string): boolean => {
      const trimmedTag = tag.trim();

      // Validate tag
      if (!trimmedTag || trimmedTag.length === 0) {
        return false;
      }

      // Check for duplicates
      if (tags.includes(trimmedTag)) {
        return false;
      }

      // Check max limit (10 tags)
      if (tags.length >= 10) {
        return false;
      }

      setValue('tags', [...tags, trimmedTag], {
        shouldValidate: true,
        shouldDirty: true,
      });

      return true;
    },
    [tags, setValue]
  );

  /**
   * Remove a tag by index
   */
  const removeTag = useCallback(
    (index: number) => {
      const newTags = tags.filter((_, i) => i !== index);
      setValue('tags', newTags, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [tags, setValue]
  );

  /**
   * Clear all tags
   */
  const clearTags = useCallback(() => {
    setValue('tags', [], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue]);

  /**
   * Apply priority preset (1-5)
   */
  const applyPriorityPreset = useCallback(
    (priority: number) => {
      setValue('priority', priority, { shouldValidate: true });
    },
    [setValue]
  );

  /**
   * Apply server URL preset
   */
  const applyServerPreset = useCallback(
    (serverUrl: string) => {
      setValue('serverUrl', serverUrl, { shouldValidate: true });
    },
    [setValue]
  );

  /**
   * Toggle authentication (clear fields if disabled)
   */
  const toggleAuthentication = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        setValue('username', '', { shouldValidate: true });
        setValue('password', '', { shouldValidate: true });
      }
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
    setIsTesting(true);
    setTestResult(undefined);

    try {
      const data = form.getValues();

      // Validate topic
      if (!isValidNtfyTopic(data.topic)) {
        setTestResult({
          success: false,
          message: 'Invalid topic name. Use only letters, numbers, hyphens, and underscores.',
        });
        return;
      }

      if (onTestCallback) {
        await onTestCallback(data);
        setTestResult({
          success: true,
          message: 'Test notification sent successfully!',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Test callback not configured',
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
    rhfReset({
      ...DEFAULT_NTFY_CONFIG,
      ...initialConfig,
    });
    setTestResult(undefined);
  }, [rhfReset, initialConfig]);

  /**
   * Cleanup on unmount: clear test results and state
   */
  useEffect(() => {
    return () => {
      setTestResult(undefined);
      setIsTesting(false);
    };
  }, []);

  return {
    form,
    tags,
    addTag,
    removeTag,
    clearTags,
    isValid,
    handleSubmit,
    handleTest,
    isTesting,
    testResult,
    clearTestResult,
    reset,
    applyPriorityPreset,
    applyServerPreset,
    hasAuthentication,
    toggleAuthentication,
  };
}
