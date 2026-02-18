/**
 * useFormResourceSync Hook
 *
 * Synchronizes React Hook Form with Universal State v2's 8-layer model.
 * Manages Edit layer (form draft), Validation layer, Optimistic layer,
 * and Error layer integration.
 *
 * @module @nasnet/core/forms/useFormResourceSync
 */

import * as React from 'react';

import type {
  ValidationError,
} from './types';
import type {
  FieldValues,
  UseFormReturn,
  Path,
} from 'react-hook-form';


/**
 * Options for useFormResourceSync hook
 */
interface UseFormResourceSyncOptions<T extends FieldValues = FieldValues> {
  /** Source data from backend to sync with */
  sourceData: T | null;
  /** Unique resource identifier */
  resourceId?: string;
  /** Resource version for conflict detection */
  resourceVersion?: string;
  /** Callback when saving */
  onSave?: (data: T) => Promise<void> | void;
  /** Callback on save error */
  onSaveError?: (error: Error) => void;
  /** Callback when source data changes during edit */
  onSourceChange?: (newSource: T) => void;
  /** Auto-reset form when source changes (default: true) */
  autoReset?: boolean;
  /** Track changed fields (default: true) */
  trackChanges?: boolean;
}

/**
 * State layers following Universal State v2 model
 */
export interface FormResourceState<T extends FieldValues = FieldValues> {
  /** Layer 1: Source data from backend/router */
  source: T | null;
  /** Layer 4: Optimistic state for pending mutations */
  optimistic: T | null;
  /** Layer 5: Current edit draft in the form */
  edit: T | null;
  /** Layer 6: Validation results */
  validation: {
    isValid: boolean;
    isValidating: boolean;
    errors: ValidationError[];
  };
  /** Layer 7: Error state */
  error: Error | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether the form is currently saving */
  isSaving: boolean;
  /** Whether the source has changed while editing */
  hasSourceChanged: boolean;
}

/**
 * Actions for managing form resource state
 */
export interface FormResourceActions<T extends FieldValues = FieldValues> {
  /** Apply source data to the form */
  applySource: (data: T) => void;
  /** Apply optimistic update (for immediate UI feedback) */
  applyOptimistic: (data: T) => void;
  /** Clear optimistic state after mutation completes */
  clearOptimistic: () => void;
  /** Start a save operation */
  startSave: () => void;
  /** Complete save operation successfully */
  completeSave: () => void;
  /** Handle save error */
  handleSaveError: (error: Error) => void;
  /** Reset form to source data */
  resetToSource: () => void;
  /** Discard changes and reset */
  discardChanges: () => void;
  /** Merge source changes with current edits (for conflict resolution) */
  mergeSourceChanges: (resolver: (source: T, edit: T) => T) => void;
}

/**
 * Return type for useFormResourceSync
 */
export interface UseFormResourceSyncReturn<T extends FieldValues = FieldValues> {
  /** Current state across all layers */
  state: FormResourceState<T>;
  /** Actions to manipulate state */
  actions: FormResourceActions<T>;
  /** Current values from the form (Layer 5 - Edit) */
  formValues: T;
  /** Computed diff between source and edit */
  changes: Partial<T>;
  /** List of changed field paths */
  changedFields: Array<Path<T>>;
  /** Whether the resource can be saved (valid and dirty) */
  canSave: boolean;
  /** Conflict state if source changed during edit */
  conflict: {
    hasConflict: boolean;
    sourceVersion?: string;
    editVersion?: string;
  };
}

/**
 * Hook for synchronizing React Hook Form with Universal State v2.
 *
 * This hook bridges the gap between:
 * - TanStack Query (cache layer) - source of truth from backend
 * - React Hook Form (edit layer) - user's current edits
 * - Optimistic UI (optimistic layer) - immediate feedback
 * - Validation state (validation layer) - pipeline results
 * - Error handling (error layer) - mutation errors
 *
 * @example
 * ```tsx
 * const form = useForm<WireGuardPeerFormData>();
 * const { data: peer } = useQuery(['peer', peerId]);
 *
 * const { state, actions, canSave, changedFields } = useFormResourceSync({
 *   form,
 *   sourceData: peer,
 *   resourceId: peerId,
 *   onSave: async (data) => {
 *     await updatePeer(peerId, data);
 *   },
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit(actions.startSave)}>
 *     {changedFields.length > 0 && <Badge>{changedFields.length} changes</Badge>}
 *     {state.hasSourceChanged && <Alert>Source data changed</Alert>}
 *     <Button disabled={!canSave}>Save</Button>
 *   </form>
 * );
 * ```
 */
export function useFormResourceSync<T extends FieldValues = FieldValues>(
  options: UseFormResourceSyncOptions<T> & { form: UseFormReturn<T> }
): UseFormResourceSyncReturn<T> {
  const {
    form,
    sourceData,
    resourceId,
    resourceVersion,
    onSave,
    onSaveError,
    onSourceChange,
    autoReset = true,
    trackChanges = true,
  } = options;

  // Internal state for layers not managed by form
  const [optimistic, setOptimistic] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSourceVersion, setLastSourceVersion] = React.useState<string | undefined>(
    resourceVersion
  );
  const [hasSourceChanged, setHasSourceChanged] = React.useState(false);

  // Track the source data
  const sourceRef = React.useRef<T | null>(sourceData ?? null);

  // Watch form state
  const formValues = form.watch();
  const { isDirty, isValid, isValidating, errors: formErrors } = form.formState;

  // Detect source changes while editing
  React.useEffect(() => {
    if (resourceVersion && lastSourceVersion && resourceVersion !== lastSourceVersion) {
      setHasSourceChanged(true);
      onSourceChange?.(sourceData as T);
    }
    setLastSourceVersion(resourceVersion);
  }, [resourceVersion, lastSourceVersion, onSourceChange]);

  // Apply source data to form when it changes (and not dirty or autoReset enabled)
  React.useEffect(() => {
    if (sourceData && (!isDirty || autoReset)) {
      sourceRef.current = sourceData;
      form.reset(sourceData);
      setHasSourceChanged(false);
    }
  }, [sourceData, form, isDirty, autoReset]);

  // Compute changed fields
  const changes = React.useMemo<Partial<T>>(() => {
    if (!trackChanges || !sourceRef.current) return {};

    const diff: Partial<T> = {};
    const source = sourceRef.current;

    for (const key of Object.keys(formValues) as Array<keyof T>) {
      const sourceValue = source[key];
      const formValue = formValues[key];

      if (JSON.stringify(sourceValue) !== JSON.stringify(formValue)) {
        diff[key] = formValue;
      }
    }

    return diff;
  }, [formValues, trackChanges]);

  const changedFields = React.useMemo(
    () => Object.keys(changes) as Array<Path<T>>,
    [changes]
  );

  // Convert form errors to ValidationError format
  const validationErrors = React.useMemo<ValidationError[]>(() => {
    const errors: ValidationError[] = [];
    const flattenErrors = (obj: object, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object') {
          if ('message' in value && typeof value.message === 'string') {
            errors.push({
              code: 'VALIDATION_ERROR',
              message: value.message,
              fieldPath: path,
            });
          } else {
            flattenErrors(value, path);
          }
        }
      }
    };
    flattenErrors(formErrors);
    return errors;
  }, [formErrors]);

  // Build state object
  const state = React.useMemo<FormResourceState<T>>(
    () => ({
      source: sourceRef.current,
      optimistic,
      edit: formValues as T,
      validation: {
        isValid,
        isValidating,
        errors: validationErrors,
      },
      error,
      isDirty,
      isSaving,
      hasSourceChanged,
    }),
    [optimistic, formValues, isValid, isValidating, validationErrors, error, isDirty, isSaving, hasSourceChanged]
  );

  // Actions
  const actions = React.useMemo<FormResourceActions<T>>(
    () => ({
      applySource: (data: T) => {
        sourceRef.current = data;
        form.reset(data);
        setHasSourceChanged(false);
      },

      applyOptimistic: (data: T) => {
        setOptimistic(data);
      },

      clearOptimistic: () => {
        setOptimistic(null);
      },

      startSave: async () => {
        if (!onSave) return;

        setIsSaving(true);
        setError(null);

        try {
          // Apply optimistic update
          setOptimistic(formValues as T);

          await onSave(formValues as T);

          // Update source on success
          sourceRef.current = formValues as T;
          form.reset(formValues as T);
          setOptimistic(null);
          setHasSourceChanged(false);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setOptimistic(null);
          onSaveError?.(error);
        } finally {
          setIsSaving(false);
        }
      },

      completeSave: () => {
        sourceRef.current = formValues as T;
        form.reset(formValues as T);
        setOptimistic(null);
        setIsSaving(false);
        setError(null);
        setHasSourceChanged(false);
      },

      handleSaveError: (err: Error) => {
        setError(err);
        setOptimistic(null);
        setIsSaving(false);
        onSaveError?.(err);
      },

      resetToSource: () => {
        if (sourceRef.current) {
          form.reset(sourceRef.current);
          setError(null);
          setHasSourceChanged(false);
        }
      },

      discardChanges: () => {
        if (sourceRef.current) {
          form.reset(sourceRef.current);
        } else {
          form.reset();
        }
        setError(null);
        setOptimistic(null);
        setHasSourceChanged(false);
      },

      mergeSourceChanges: (resolver: (source: T, edit: T) => T) => {
        if (sourceData && sourceRef.current) {
          const merged = resolver(sourceData, formValues as T);
          sourceRef.current = sourceData;
          form.reset(merged);
          setHasSourceChanged(false);
        }
      },
    }),
    [form, formValues, sourceData, onSave, onSaveError]
  );

  // Computed values
  const canSave = isDirty && isValid && !isSaving;

  const conflict = React.useMemo(
    () => ({
      hasConflict: hasSourceChanged && isDirty,
      sourceVersion: resourceVersion,
      editVersion: lastSourceVersion,
    }),
    [hasSourceChanged, isDirty, resourceVersion, lastSourceVersion]
  );

  return {
    state,
    actions,
    formValues: formValues as T,
    changes,
    changedFields,
    canSave,
    conflict,
  };
}

export default useFormResourceSync;
