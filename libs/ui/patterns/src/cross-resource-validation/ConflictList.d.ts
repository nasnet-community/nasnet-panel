/**
 * ConflictList Component
 *
 * Displays a list of cross-resource validation conflicts
 * with filtering and summary.
 *
 * @module @nasnet/ui/patterns/cross-resource-validation
 */
import type { ResourceConflict, ConflictSeverity } from './types';
export interface ConflictListProps {
    /** List of conflicts to display */
    conflicts: ResourceConflict[];
    /** Callback when a resolution is selected */
    onSelectResolution?: (conflictId: string, resolutionId: string) => void;
    /** Filter by severity (show only these severities) */
    severityFilter?: ConflictSeverity[];
    /** Title for the list */
    title?: string;
    /** Whether to show the summary header */
    showSummary?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Displays a list of cross-resource conflicts with summary and filtering.
 *
 * @example
 * ```tsx
 * <ConflictList
 *   conflicts={validationConflicts}
 *   onSelectResolution={handleResolve}
 *   showSummary
 * />
 * ```
 */
export declare function ConflictList({ conflicts, onSelectResolution, severityFilter, title, showSummary, emptyMessage, className, }: ConflictListProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConflictList {
    var displayName: string;
}
//# sourceMappingURL=ConflictList.d.ts.map