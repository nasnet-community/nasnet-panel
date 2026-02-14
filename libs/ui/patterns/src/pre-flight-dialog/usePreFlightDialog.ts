/**
 * PreFlightDialog Headless Hook
 *
 * Provides all logic and state for pre-flight resource checking dialog.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Calculate total memory that would be freed
 * - Determine if selected services are sufficient
 * - Track selection state
 * - Provide formatted text for display
 */

import { useState, useMemo, useCallback } from 'react';

import type { PreFlightDialogProps, ServiceSuggestion } from './types';

// ===== Constants =====

/**
 * Buffer percentage to add to deficit calculation (10%)
 */
const BUFFER_PERCENTAGE = 0.1;

// ===== Hook State Interface =====

/**
 * State returned by usePreFlightDialog hook
 */
export interface UsePreFlightDialogReturn {
  /**
   * Service suggestions with selection state
   */
  suggestions: ServiceSuggestion[];

  /**
   * Toggle selection for a service
   */
  toggleSelection: (serviceId: string) => void;

  /**
   * Select all suggestions
   */
  selectAll: () => void;

  /**
   * Clear all selections
   */
  clearAll: () => void;

  /**
   * Total memory that would be freed from selected services (in MB)
   */
  totalFreed: number;

  /**
   * Whether the selected services are sufficient to cover the deficit
   */
  isSufficient: boolean;

  /**
   * Number of selected services
   */
  selectedCount: number;

  /**
   * Memory still needed after selected services stopped (0 if sufficient)
   */
  remainingDeficit: number;

  /**
   * Formatted required text (e.g., "256 MB")
   */
  requiredText: string;

  /**
   * Formatted available text (e.g., "200 MB")
   */
  availableText: string;

  /**
   * Formatted deficit text (e.g., "56 MB")
   */
  deficitText: string;

  /**
   * Formatted total freed text (e.g., "128 MB")
   */
  totalFreedText: string;

  /**
   * Formatted remaining deficit text (e.g., "28 MB")
   */
  remainingDeficitText: string;

  /**
   * Confirm action with selected services
   */
  handleConfirm: () => void;

  /**
   * Override action (dangerous)
   */
  handleOverride?: () => void;

  /**
   * Cancel action
   */
  handleCancel: () => void;
}

// ===== Helper Functions =====

/**
 * Format memory value with unit
 */
function formatMemory(mb: number): string {
  return `${Math.round(mb)} MB`;
}

/**
 * Calculate total memory freed from selected services
 */
function calculateTotalFreed(suggestions: ServiceSuggestion[]): number {
  return suggestions
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + s.memoryUsage, 0);
}

// ===== Hook Implementation =====

/**
 * Headless hook for pre-flight dialog state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function PreFlightDialogMobile(props: PreFlightDialogProps) {
 *   const state = usePreFlightDialog(props);
 *
 *   return (
 *     <Sheet open={props.open} onOpenChange={props.onOpenChange}>
 *       <p>{state.deficitText} needed</p>
 *       {state.suggestions.map(s => (
 *         <Checkbox
 *           checked={s.selected}
 *           onCheckedChange={() => state.toggleSelection(s.id)}
 *         />
 *       ))}
 *       <Button disabled={!state.isSufficient} onClick={state.handleConfirm}>
 *         Confirm
 *       </Button>
 *     </Sheet>
 *   );
 * }
 * ```
 */
export function usePreFlightDialog(
  props: PreFlightDialogProps
): UsePreFlightDialogReturn {
  const {
    error,
    onConfirmWithStops,
    onOverrideAndStart,
    onOpenChange,
  } = props;

  // Initialize selection state from suggestions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Auto-select suggestions in order until deficit is covered
    const autoSelected = new Set<string>();
    let freed = 0;
    const deficitWithBuffer = error.deficit * (1 + BUFFER_PERCENTAGE);

    for (const suggestion of error.suggestions) {
      if (freed >= deficitWithBuffer) break;
      autoSelected.add(suggestion.id);
      freed += suggestion.memoryUsage;
    }

    return autoSelected;
  });

  // Create suggestions with selection state
  const suggestions = useMemo(
    () =>
      error.suggestions.map((s) => ({
        ...s,
        selected: selectedIds.has(s.id),
      })),
    [error.suggestions, selectedIds]
  );

  // Toggle selection for a service
  const toggleSelection = useCallback((serviceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  // Select all suggestions
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(error.suggestions.map((s) => s.id)));
  }, [error.suggestions]);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Calculate total memory freed
  const totalFreed = useMemo(() => calculateTotalFreed(suggestions), [suggestions]);

  // Calculate deficit with 10% buffer
  const deficitWithBuffer = useMemo(
    () => error.deficit * (1 + BUFFER_PERCENTAGE),
    [error.deficit]
  );

  // Check if selection is sufficient
  const isSufficient = useMemo(
    () => totalFreed >= deficitWithBuffer,
    [totalFreed, deficitWithBuffer]
  );

  // Calculate remaining deficit
  const remainingDeficit = useMemo(
    () => Math.max(0, deficitWithBuffer - totalFreed),
    [deficitWithBuffer, totalFreed]
  );

  // Selected count
  const selectedCount = selectedIds.size;

  // Formatted text
  const requiredText = formatMemory(error.required);
  const availableText = formatMemory(error.available);
  const deficitText = formatMemory(error.deficit);
  const totalFreedText = formatMemory(totalFreed);
  const remainingDeficitText = formatMemory(remainingDeficit);

  // Actions
  const handleConfirm = useCallback(() => {
    const selected = Array.from(selectedIds);
    onConfirmWithStops(selected);
    onOpenChange(false);
  }, [selectedIds, onConfirmWithStops, onOpenChange]);

  const handleOverride = useMemo(
    () =>
      onOverrideAndStart
        ? () => {
            onOverrideAndStart();
            onOpenChange(false);
          }
        : undefined,
    [onOverrideAndStart, onOpenChange]
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return {
    suggestions,
    toggleSelection,
    selectAll,
    clearAll,
    totalFreed,
    isSufficient,
    selectedCount,
    remainingDeficit,
    requiredText,
    availableText,
    deficitText,
    totalFreedText,
    remainingDeficitText,
    handleConfirm,
    handleOverride,
    handleCancel,
  };
}
