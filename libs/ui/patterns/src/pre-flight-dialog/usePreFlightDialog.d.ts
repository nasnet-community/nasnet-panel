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
import type { PreFlightDialogProps, ServiceSuggestion } from './types';
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
export declare function usePreFlightDialog(props: PreFlightDialogProps): UsePreFlightDialogReturn;
//# sourceMappingURL=usePreFlightDialog.d.ts.map