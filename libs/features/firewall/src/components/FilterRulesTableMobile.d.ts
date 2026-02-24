/**
 * FilterRulesTableMobile Component
 * @description Mobile-optimized card-based layout for filter rules
 *
 * Domain component for displaying filter rules on mobile devices with:
 * - Card-based layout optimized for touch
 * - Inline actions (Edit, Duplicate, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 */
import type { FilterChain } from '@nasnet/core/types';
export interface FilterRulesTableMobileProps {
    className?: string;
    chain?: FilterChain;
}
/**
 * FilterRulesTableMobile Component
 *
 * Mobile-optimized card-based layout for filter rules.
 *
 * Features:
 * - Touch-friendly card layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle
 * - Compact counter display
 *
 * @param props - Component props
 * @returns Mobile filter rules table component
 */
export declare const FilterRulesTableMobile: import("react").NamedExoticComponent<FilterRulesTableMobileProps>;
//# sourceMappingURL=FilterRulesTableMobile.d.ts.map