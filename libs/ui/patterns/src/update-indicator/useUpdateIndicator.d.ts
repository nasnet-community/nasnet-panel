/**
 * UpdateIndicator Headless Hook
 *
 * Provides all logic and state for update indicator visualization.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Determine update status (no update, minor, major, security)
 * - Map severity to semantic colors
 * - Format version strings
 * - Calculate time since release
 * - Provide accessibility attributes
 * - Handle user interactions (update, rollback, view changelog)
 */
import type { UpdateIndicatorProps, SeverityConfig, StageConfig } from './types';
/**
 * State returned by useUpdateIndicator hook
 */
export interface UseUpdateIndicatorReturn {
    /**
     * Whether an update is available
     */
    hasUpdate: boolean;
    /**
     * Update severity configuration
     */
    severityConfig: SeverityConfig | null;
    /**
     * Current update stage configuration
     */
    stageConfig: StageConfig | null;
    /**
     * Formatted current version string
     */
    currentVersionText: string;
    /**
     * Formatted latest version string
     */
    latestVersionText: string;
    /**
     * Version change description (e.g., "1.0.0 → 1.1.0")
     */
    versionChangeText: string;
    /**
     * Human-readable time since release
     */
    releaseDateText: string | null;
    /**
     * Formatted binary size (e.g., "12.5 MB")
     */
    binarySizeText: string | null;
    /**
     * Whether "Update" button should be disabled
     */
    updateDisabled: boolean;
    /**
     * Whether "Rollback" button should be visible
     */
    showRollback: boolean;
    /**
     * Whether progress bar should be visible
     */
    showProgress: boolean;
    /**
     * Current progress percentage (0-100)
     */
    progressPercent: number;
    /**
     * Progress message
     */
    progressMessage: string;
    /**
     * Whether update is in terminal state (complete/failed/rolled back)
     */
    isTerminalState: boolean;
    /**
     * ARIA label for screen readers
     */
    ariaLabel: string;
    /**
     * Handle update button click
     */
    handleUpdate: () => void;
    /**
     * Handle rollback button click
     */
    handleRollback: () => void;
    /**
     * Handle view changelog button click
     */
    handleViewChangelog: () => void;
}
/**
 * Headless hook for update indicator state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function UpdateIndicatorMobile(props: UpdateIndicatorProps) {
 *   const state = useUpdateIndicator(props);
 *
 *   if (!state.hasUpdate) return null;
 *
 *   return (
 *     <div aria-label={state.ariaLabel}>
 *       <Badge className={state.severityConfig?.bgColor}>
 *         {state.severityConfig?.label}
 *       </Badge>
 *       <p>{state.versionChangeText}</p>
 *       <Button onClick={state.handleUpdate} disabled={state.updateDisabled}>
 *         Update
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useUpdateIndicator(props: UpdateIndicatorProps): UseUpdateIndicatorReturn;
//# sourceMappingURL=useUpdateIndicator.d.ts.map