/**
 * RAW Rules Table Component (Desktop)
 *
 * Domain component for displaying RAW rules with drag-drop reordering.
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
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 */
export interface RawRulesTableDesktopProps {
    /** Optional className for styling */
    className?: string;
    /** Optional chain filter */
    chain?: string;
}
/**
 * RawRulesTableDesktop Component
 * @description Desktop presenter for RAW firewall rules with drag-drop reordering
 *
 * Features:
 * - Drag-drop reordering with dnd-kit
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions
 * - Counter visualization (packets/bytes with relative bar)
 * - Disabled rules styling (opacity-50)
 * - Unused rules badge (zero packets)
 * - Highlight scroll-to-view for recently created/edited rules
 *
 * @example
 * ```tsx
 * <RawRulesTableDesktop chain="forward" />
 * ```
 */
export declare const RawRulesTableDesktop: {
    ({ className, chain }: RawRulesTableDesktopProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=RawRulesTableDesktop.d.ts.map