/**
 * useFormResourceSync Hook
 *
 * Synchronizes React Hook Form with Universal State v2's 8-layer model.
 * Manages Edit layer (form draft), Validation layer, Optimistic layer,
 * and Error layer integration.
 *
 * @module @nasnet/core/forms/useFormResourceSync
 */
import type { ValidationError } from './types';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';
/**
 * Options for useFormResourceSync hook.
 */
export interface UseFormResourceSyncOptions<T extends FieldValues = FieldValues> {
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
 * Handles:
 * - Automatic form reset when source data changes
 * - Tracking of changed fields and dirty state
 * - Conflict detection when source changes during edit
 * - Optimistic updates with rollback on error
 * - Form error mapping from validation pipeline
 *
 * @template T - Form field values type
 * @param options - Configuration options including React Hook Form instance
 * @returns State and action methods for form resource synchronization
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
 *   <form onSubmit={form.handleSubmit(async () => {
 *     await actions.startSave();
 *   })}>
 *     {changedFields.length > 0 && <Badge>{changedFields.length} changes</Badge>}
 *     {state.hasSourceChanged && <Alert>Source data changed</Alert>}
 *     <Button disabled={!canSave}>Save</Button>
 *   </form>
 * );
 * ```
 */
export declare function useFormResourceSync<T extends FieldValues = FieldValues>(options: UseFormResourceSyncOptions<T> & {
    form: UseFormReturn<T>;
}): UseFormResourceSyncReturn<T>;
//# sourceMappingURL=useFormResourceSync.d.ts.map