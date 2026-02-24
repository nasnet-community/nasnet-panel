/**
 * Filter Rules Table Component (Platform Wrapper)
 *
 * @description Platform-aware wrapper for filter rules table with automatic detection and rendering
 * of appropriate presenter (Mobile/Desktop). Supports drag-drop reordering, inline toggles, and
 * CRUD actions with counter visualization.
 *
 * Features:
 * - Automatic platform detection (Mobile/Desktop)
 * - Drag-drop reordering (Desktop only)
 * - Inline enable/disable toggle
 * - CRUD actions (Edit, Duplicate, Delete)
 * - Counter visualization
 * - Disabled rules styling
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
export interface FilterRulesTableProps {
    /** Optional CSS class name for custom styling */
    className?: string;
    /** Optional firewall chain filter (e.g., 'forward', 'input', 'output') */
    chain?: string;
}
/**
 * FilterRulesTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate filter rules table
 */
export declare const FilterRulesTable: import("react").NamedExoticComponent<FilterRulesTableProps>;
//# sourceMappingURL=FilterRulesTable.d.ts.map