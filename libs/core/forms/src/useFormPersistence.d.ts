/**
 * useFormPersistence Hook
 *
 * Persists form data to storage for recovery after page reload.
 * Useful for long wizard flows where users may accidentally navigate away.
 *
 * @module @nasnet/core/forms/useFormPersistence
 */
import type { UseFormReturn, FieldValues } from 'react-hook-form';
/**
 * Options for the useFormPersistence hook.
 */
export interface UseFormPersistenceOptions<T extends FieldValues> {
    /** React Hook Form instance */
    form: UseFormReturn<T>;
    /** Unique key for storage */
    storageKey: string;
    /** Storage implementation (defaults to sessionStorage) */
    storage?: Storage;
    /** Debounce delay in milliseconds (defaults to 1000) */
    debounceMs?: number;
    /** Fields to exclude from persistence */
    excludeFields?: (keyof T)[];
}
/**
 * Return type of useFormPersistence hook.
 */
export interface UseFormPersistenceResult {
    /** Clear persisted data */
    clearPersistence: () => void;
    /** Check if there's saved data */
    hasSavedData: () => boolean;
    /** Restore data from storage (called automatically on mount) */
    restore: () => boolean;
}
/**
 * Custom hook to persist form data to storage.
 *
 * Automatically saves form state on changes and restores on mount.
 * Useful for multi-step wizards where users might accidentally
 * refresh the page or navigate away.
 *
 * @template T - Form field values type
 * @param options - Persistence configuration
 * @returns Methods to control persistence
 *
 * @example
 * ```tsx
 * function WizardStep() {
 *   const form = useZodForm({ schema, defaultValues });
 *   const persistence = useFormPersistence({
 *     form,
 *     storageKey: 'wizard-step-1',
 *   });
 *
 *   const handleComplete = () => {
 *     // Clear saved data when wizard completes
 *     persistence.clearPersistence();
 *   };
 *
 *   return (
 *     <>
 *       {persistence.hasSavedData() && (
 *         <Alert>Restored your previous progress</Alert>
 *       )}
 *       <form>...</form>
 *     </>
 *   );
 * }
 * ```
 */
export declare function useFormPersistence<T extends FieldValues>({ form, storageKey, storage, debounceMs, excludeFields, }: UseFormPersistenceOptions<T>): UseFormPersistenceResult;
//# sourceMappingURL=useFormPersistence.d.ts.map