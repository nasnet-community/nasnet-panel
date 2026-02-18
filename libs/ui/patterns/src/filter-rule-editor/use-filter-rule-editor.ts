/**
 * Headless useFilterRuleEditor Hook
 *
 * Manages filter rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 * @see NAS-7.1: Implement Filter Rules
 */

import { useCallback, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';

import {
  FilterRuleSchema,
  getVisibleFieldsForFilterAction,
  getRequiredFieldsForFilterAction,
  generateRulePreview,
  chainAllowsOutInterface,
  chainAllowsInInterface,
  type FilterRule,
  type FilterRuleInput,
  type FilterAction,
  type FilterChain,
} from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

export interface UseFilterRuleEditorOptions {
  /** Initial rule values for editing */
  initialRule?: Partial<FilterRule>;
  /** Callback when form is successfully submitted */
  onSubmit?: (rule: FilterRuleInput) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

export interface UseFilterRuleEditorReturn {
  /** React Hook Form instance */
  form: UseFormReturn<FilterRuleInput>;
  /** Current rule state (from form.watch()) */
  rule: Partial<FilterRule>;
  /** Is form valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** Human-readable preview */
  preview: string;
  /** Reset form to initial state */
  reset: () => void;
  /** Duplicate rule (copy another rule's values) */
  duplicate: (sourceRule: Partial<FilterRule>) => void;
  /** Visible fields for current action */
  visibleFields: string[];
  /** Handle form submission */
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  /** Can use outInterface (based on chain) */
  canUseOutInterface: boolean;
  /** Can use inInterface (based on chain) */
  canUseInInterface: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for filter rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useFilterRuleEditor({
 *   initialRule: { chain: 'input', action: 'accept' },
 *   onSubmit: async (rule) => {
 *     await createFilterRule({ routerId, rule });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.onSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="action"
 *       render={({ field }) => <Select {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useFilterRuleEditor(
  options: UseFilterRuleEditorOptions = {}
): UseFilterRuleEditorReturn {
  const { initialRule, onSubmit: onSubmitCallback, onCancel } = options;

  // Initialize React Hook Form with Zod validation
  const form = useForm<FilterRuleInput>({
    resolver: zodResolver(FilterRuleSchema),
    defaultValues: {
      chain: 'input',
      action: 'accept',
      disabled: false,
      log: false,
      protocol: 'tcp',
      ...initialRule,
    },
    mode: 'onChange', // Validate on change for instant feedback
  });

  // Watch current form state
  const rule = form.watch();

  // Extract form errors
  const errors = useMemo(() => {
    const formErrors = form.formState.errors;
    const errorMap: Record<string, string> = {};

    Object.entries(formErrors).forEach(([key, error]) => {
      const err = error as { message?: string } | undefined;
      if (err?.message) {
        errorMap[key] = err.message;
      }
    });

    return errorMap;
  }, [form.formState.errors]);

  // Get visible fields for current action
  const visibleFields = useMemo(() => {
    return getVisibleFieldsForFilterAction(rule.action || 'accept');
  }, [rule.action]);

  // Check if chain allows interface usage
  const canUseOutInterface = useMemo(() => {
    return chainAllowsOutInterface(rule.chain || 'input');
  }, [rule.chain]);

  const canUseInInterface = useMemo(() => {
    return chainAllowsInInterface(rule.chain || 'input');
  }, [rule.chain]);

  // Generate human-readable preview
  const preview = useMemo(() => {
    return generateRulePreview(rule);
  }, [rule]);

  // Reset form to initial state
  const reset = useCallback(() => {
    form.reset({
      chain: 'input',
      action: 'accept',
      disabled: false,
      log: false,
      protocol: 'tcp',
      ...initialRule,
    });
  }, [form, initialRule]);

  // Duplicate rule (copy another rule's values)
  const duplicate = useCallback(
    (sourceRule: Partial<FilterRule>) => {
      form.reset({
        ...sourceRule,
        id: undefined, // Clear ID for new rule
        order: undefined, // Clear order
      });
    },
    [form]
  );

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    await onSubmitCallback?.(data);
  });

  return {
    form,
    rule,
    isValid: form.formState.isValid,
    errors,
    preview,
    reset,
    duplicate,
    visibleFields,
    onSubmit,
    canUseOutInterface,
    canUseInInterface,
  };
}

/**
 * Validate log prefix helper
 */
export function validateLogPrefix(prefix: string): string | true {
  if (!prefix) return 'Log prefix is required when logging is enabled';
  if (!/^[a-zA-Z0-9-]+$/.test(prefix)) {
    return 'Log prefix must contain only alphanumeric characters and hyphens';
  }
  if (prefix.length > 50) {
    return 'Log prefix must be 50 characters or less';
  }
  return true;
}

/**
 * Validate jump target helper
 */
export function validateJumpTarget(target: string): string | true {
  if (!target) return 'Jump target chain name is required';
  if (target.length > 63) {
    return 'Jump target must be 63 characters or less';
  }
  return true;
}
