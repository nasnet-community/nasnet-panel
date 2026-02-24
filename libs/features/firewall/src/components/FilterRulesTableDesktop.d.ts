/**
 * Filter Rules Table Component (Desktop)
 *
 * Domain component for displaying filter rules with drag-drop reordering.
 * Desktop presenter with dense data table layout.
 *
 * Features:
 * - Drag-drop reordering using dnd-kit
 * - Inline enable/disable toggle
 * - Action buttons (Edit, Duplicate, Delete)
 * - Rule counter visualization
 * - Disabled rules styling (opacity-50)
 * - Unused rules badge (0 hits)
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 */
import type { FilterChain } from '@nasnet/core/types';
export interface FilterRulesTableDesktopProps {
    className?: string;
    chain?: FilterChain;
}
/**
 * FilterRulesTableDesktop Component
 *
 * @description Desktop-optimized table for managing MikroTik filter rules with drag-drop reordering,
 * inline toggle, and detailed statistics visualization. Supports rule search highlight and traffic monitoring.
 *
 * Features:
 * - Drag-drop reordering with keyboard support
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions with confirmation
 * - Counter visualization (packets/bytes) with relative bar
 * - Disabled rules styling
 * - Unused rules highlighting (0 hits)
 * - URL-based rule highlighting with auto-scroll
 * - Traffic statistics panel with export
 *
 * @param props - Component props with optional className and chain filter
 * @returns Filter rules table component or loading/error state
 */
export declare const FilterRulesTableDesktop: import("react").NamedExoticComponent<FilterRulesTableDesktopProps>;
//# sourceMappingURL=FilterRulesTableDesktop.d.ts.map