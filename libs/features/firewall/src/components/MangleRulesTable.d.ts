/**
 * Mangle Rules Table Component (Platform Wrapper)
 *
 * @description Platform-aware wrapper for mangle rules table with automatic detection and rendering
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
 * @see NAS-7.5: Implement Mangle Rules - Task 5
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
export interface MangleRulesTableProps {
    /** Optional CSS class name for custom styling */
    className?: string;
    /** Optional firewall chain filter (e.g., 'forward', 'input', 'output') */
    chain?: string;
}
/**
 * MangleRulesTable Component
 *
 * Platform-aware wrapper that renders:
 * - Desktop: Dense table with drag-drop reordering
 * - Mobile: Card-based layout with touch-friendly controls
 *
 * @param props - Component props
 * @returns Platform-appropriate mangle rules table
 */
export declare const MangleRulesTable: import("react").NamedExoticComponent<MangleRulesTableProps>;
//# sourceMappingURL=MangleRulesTable.d.ts.map