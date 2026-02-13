/**
 * useTemplatePreview Hook
 *
 * Headless hook for TemplatePreview pattern component.
 * Provides React Hook Form integration with Zod validation for template variables.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type {
  FirewallTemplate,
  TemplatePreviewResult,
  TemplateVariableValues,
  PreviewMode,
} from './template-preview.types';
import { createTemplateVariablesSchema } from './template-preview.types';

export interface UseTemplatePreviewOptions {
  /** Template to preview */
  template: FirewallTemplate;

  /** Callback to generate preview (calls backend) */
  onGeneratePreview?: (variables: TemplateVariableValues) => Promise<TemplatePreviewResult>;

  /** Initial variable values */
  initialValues?: TemplateVariableValues;

  /** Auto-preview on variable change */
  autoPreview?: boolean;

  /** Debounce delay for auto-preview (ms) */
  autoPreviewDelay?: number;
}

export interface UseTemplatePreviewReturn {
  // Form state
  form: ReturnType<typeof useForm<TemplateVariableValues>>;
  variables: TemplateVariableValues;
  isValid: boolean;
  isDirty: boolean;

  // Preview state
  previewResult: TemplatePreviewResult | null;
  isGeneratingPreview: boolean;
  previewError: string | null;

  // Actions
  generatePreview: () => Promise<void>;
  resetVariables: () => void;
  setVariable: (name: string, value: string) => void;

  // Preview mode
  activeMode: PreviewMode;
  setActiveMode: (mode: PreviewMode) => void;

  // Computed
  hasConflicts: boolean;
  hasWarnings: boolean;
  canApply: boolean;
}

/**
 * Generate default values for template variables
 */
function getDefaultValues(
  template: FirewallTemplate,
  initialValues?: TemplateVariableValues
): TemplateVariableValues {
  const defaults: TemplateVariableValues = {};

  template.variables.forEach((variable) => {
    if (initialValues && initialValues[variable.name]) {
      defaults[variable.name] = initialValues[variable.name];
    } else if (variable.defaultValue) {
      defaults[variable.name] = variable.defaultValue;
    } else {
      defaults[variable.name] = '';
    }
  });

  return defaults;
}

/**
 * Headless hook for template preview logic
 */
export function useTemplatePreview(
  options: UseTemplatePreviewOptions
): UseTemplatePreviewReturn {
  const {
    template,
    onGeneratePreview,
    initialValues,
    autoPreview = false,
    autoPreviewDelay = 1000,
  } = options;

  // Create Zod schema from template variables
  const variableSchema = useMemo(
    () => createTemplateVariablesSchema(template.variables),
    [template.variables]
  );

  // Initialize React Hook Form
  const form = useForm<TemplateVariableValues>({
    resolver: zodResolver(variableSchema),
    defaultValues: getDefaultValues(template, initialValues),
    mode: 'onChange', // Validate on change for real-time feedback
  });

  const { watch, formState } = form;
  const { isValid, isDirty, errors } = formState;

  // Watch all variables
  const variables = watch();

  // Preview state
  const [previewResult, setPreviewResult] = useState<TemplatePreviewResult | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<PreviewMode>('variables');

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!onGeneratePreview) {
      console.warn('onGeneratePreview callback not provided');
      return;
    }

    if (!isValid) {
      setPreviewError('Please fix validation errors before previewing');
      return;
    }

    setIsGeneratingPreview(true);
    setPreviewError(null);

    try {
      const result = await onGeneratePreview(variables);
      setPreviewResult(result);

      // Auto-switch to conflicts tab if conflicts exist
      if (result.conflicts && result.conflicts.length > 0) {
        setActiveMode('conflicts');
      } else {
        setActiveMode('rules');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate preview';
      setPreviewError(errorMessage);
      setPreviewResult(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [onGeneratePreview, variables, isValid]);

  // Auto-preview on variable change (debounced)
  useEffect(() => {
    if (!autoPreview || !isValid || !isDirty) {
      return;
    }

    const timeoutId = setTimeout(() => {
      generatePreview();
    }, autoPreviewDelay);

    return () => clearTimeout(timeoutId);
  }, [autoPreview, autoPreviewDelay, variables, isValid, isDirty, generatePreview]);

  // Reset variables to defaults
  const resetVariables = useCallback(() => {
    form.reset(getDefaultValues(template, initialValues));
    setPreviewResult(null);
    setPreviewError(null);
    setActiveMode('variables');
  }, [form, template, initialValues]);

  // Set individual variable
  const setVariable = useCallback(
    (name: string, value: string) => {
      form.setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  // Computed values
  const hasConflicts = useMemo(
    () => (previewResult?.conflicts?.length || 0) > 0,
    [previewResult]
  );

  const hasWarnings = useMemo(
    () => (previewResult?.impactAnalysis?.warnings?.length || 0) > 0,
    [previewResult]
  );

  const canApply = useMemo(
    () => isValid && previewResult !== null && !hasConflicts,
    [isValid, previewResult, hasConflicts]
  );

  return {
    // Form state
    form,
    variables,
    isValid,
    isDirty,

    // Preview state
    previewResult,
    isGeneratingPreview,
    previewError,

    // Actions
    generatePreview,
    resetVariables,
    setVariable,

    // Preview mode
    activeMode,
    setActiveMode,

    // Computed
    hasConflicts,
    hasWarnings,
    canApply,
  };
}
