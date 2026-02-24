/**
 * Mangle Rules Table Component (Mobile)
 *
 * Domain component for displaying mangle rules on mobile devices.
 * Mobile presenter with card layout and swipe actions.
 *
 * Features:
 * - Card-based layout optimized for touch
 * - Swipe actions (Edit, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.5: Implement Mangle Rules - Task 7
 */
import React from 'react';
export interface MangleRulesTableMobileProps {
    className?: string;
    chain?: string;
}
/**
 * MangleRulesTableMobile Component
 *
 * @description Mobile-optimized card-based layout for mangle rules
 * with touch-friendly interactions and 44px minimum touch targets.
 *
 * Features:
 * - Touch-friendly card layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle
 * - Compact counter display
 *
 * @example
 * ```tsx
 * <MangleRulesTableMobile
 *   chain="forward"
 *   className="space-y-3"
 * />
 * ```
 */
export declare const MangleRulesTableMobile: React.NamedExoticComponent<MangleRulesTableMobileProps>;
//# sourceMappingURL=MangleRulesTableMobile.d.ts.map