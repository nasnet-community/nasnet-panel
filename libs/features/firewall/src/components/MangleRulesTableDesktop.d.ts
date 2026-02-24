/**
 * Mangle Rules Table Component (Desktop)
 *
 * Domain component for displaying mangle rules with drag-drop reordering.
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
 * @see NAS-7.5: Implement Mangle Rules - Task 5
 */
import React from 'react';
export interface MangleRulesTableDesktopProps {
    className?: string;
    chain?: string;
}
/**
 * MangleRulesTableDesktop Component
 *
 * @description Desktop-optimized dense table for mangle rules with
 * drag-drop reordering and inline actions.
 *
 * Features:
 * - Drag-drop reordering
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions
 * - Counter visualization (packets/bytes)
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @example
 * ```tsx
 * <MangleRulesTableDesktop
 *   chain="forward"
 *   className="rounded-lg border"
 * />
 * ```
 */
export declare const MangleRulesTableDesktop: React.NamedExoticComponent<MangleRulesTableDesktopProps>;
//# sourceMappingURL=MangleRulesTableDesktop.d.ts.map