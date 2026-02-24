/**
 * RAW Rules Table Component (Mobile)
 *
 * Domain component for displaying RAW rules on mobile devices.
 * Mobile presenter with card layout and touch-friendly interactions.
 *
 * Features:
 * - Card-based layout optimized for touch
 * - Inline actions (Edit, Duplicate, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 */
export interface RawRulesTableMobileProps {
    /** Optional className for styling */
    className?: string;
    /** Optional chain filter */
    chain?: string;
}
/**
 * RawRulesTableMobile Component
 * @description Mobile presenter for RAW firewall rules with card layout
 *
 * Features:
 * - Touch-friendly card-based layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle for each rule
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge (zero packets)
 *
 * @example
 * ```tsx
 * <RawRulesTableMobile chain="forward" />
 * ```
 */
export declare const RawRulesTableMobile: {
    ({ className, chain }: RawRulesTableMobileProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=RawRulesTableMobile.d.ts.map