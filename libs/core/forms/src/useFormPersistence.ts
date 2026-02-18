/**
 * useFormPersistence Hook
 *
 * Persists form data to storage for recovery after page reload.
 * Useful for long wizard flows where users may accidentally navigate away.
 *
 * @module @nasnet/core/forms/useFormPersistence
 */

import { useEffect, useCallback, useRef } from 'react';

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
export function useFormPersistence<T extends FieldValues>({
  form,
  storageKey,
  storage = typeof window !== 'undefined' ? sessionStorage : undefined,
  debounceMs = 1000,
  excludeFields = [],
}: UseFormPersistenceOptions<T>): UseFormPersistenceResult {
  const hasRestoredRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Filter out excluded fields from form values.
   */
  const filterValues = useCallback(
    (values: T): Partial<T> => {
      if (excludeFields.length === 0) return values;

      const filtered: Partial<T> = { ...values };
      excludeFields.forEach((field) => {
        delete filtered[field as keyof Partial<T>];
      });
      return filtered;
    },
    [excludeFields]
  );

  /**
   * Restore form data from storage.
   */
  const restore = useCallback((): boolean => {
    if (!storage || hasRestoredRef.current) return false;

    const saved = storage.getItem(storageKey);
    if (!saved) return false;

    try {
      const parsed = JSON.parse(saved) as T;
      form.reset(parsed, { keepDefaultValues: true });
      hasRestoredRef.current = true;
      return true;
    } catch {
      // Invalid JSON, clear it
      storage.removeItem(storageKey);
      return false;
    }
  }, [form, storageKey, storage]);

  /**
   * Restore form data on mount.
   */
  useEffect(() => {
    restore();
  }, [restore]);

  /**
   * Persist form data on change with debouncing.
   */
  useEffect(() => {
    if (!storage) return;

    const subscription = form.watch((values) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the save
      timeoutRef.current = setTimeout(() => {
        const filtered = filterValues(values as T);
        storage.setItem(storageKey, JSON.stringify(filtered));
      }, debounceMs);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [form, storageKey, storage, debounceMs, filterValues]);

  /**
   * Clear persistence.
   */
  const clearPersistence = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    storage?.removeItem(storageKey);
    hasRestoredRef.current = false;
  }, [storageKey, storage]);

  /**
   * Check if there's saved data.
   */
  const hasSavedData = useCallback((): boolean => {
    if (!storage) return false;
    return storage.getItem(storageKey) !== null;
  }, [storageKey, storage]);

  return {
    clearPersistence,
    hasSavedData,
    restore,
  };
}

export default useFormPersistence;
