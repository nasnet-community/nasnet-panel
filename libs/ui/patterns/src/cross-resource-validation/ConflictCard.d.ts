/**
 * ConflictCard Component
 *
 * Displays a single cross-resource conflict with affected resources
 * and available resolution options.
 *
 * @module @nasnet/ui/patterns/cross-resource-validation
 */
import type { ResourceConflict } from './types';
export interface ConflictCardProps {
    /** The conflict to display */
    conflict: ResourceConflict;
    /** Whether the card is expanded */
    isExpanded?: boolean;
    /** Callback when expand/collapse is toggled */
    onToggle?: () => void;
    /** Callback when a resolution is selected */
    onSelectResolution?: (conflictId: string, resolutionId: string) => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Displays a single cross-resource conflict with expandable details.
 *
 * @example
 * ```tsx
 * <ConflictCard
 *   conflict={{
 *     id: '1',
 *     type: 'ip_collision',
 *     severity: 'error',
 *     title: 'IP Address Collision',
 *     description: 'Multiple interfaces have the same IP',
 *     resources: [...],
 *     resolutions: [...],
 *   }}
 *   onSelectResolution={(conflictId, resolutionId) => handleResolve()}
 * />
 * ```
 */
export declare function ConflictCard({ conflict, isExpanded, onToggle, onSelectResolution, className, }: ConflictCardProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConflictCard {
    var displayName: string;
}
//# sourceMappingURL=ConflictCard.d.ts.map