/**
 * Rate Limit Rules Table - Mobile Presenter
 * Card-based accordion layout with 44px touch targets
 *
 * Features:
 * - Card-based layout with stacked information
 * - 44px minimum touch targets (WCAG AAA)
 * - Action badges with semantic colors
 * - Swipe gestures for delete (future enhancement)
 * - Disabled rules styling (opacity-50)
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitRule } from '@nasnet/core/types';
import type { RateLimitRulesTablePresenterProps } from './types';
export interface RateLimitRulesTableMobileProps extends Omit<RateLimitRulesTablePresenterProps, 'onReorder' | 'pollingInterval'> {
    editingRule: RateLimitRule | null;
    deleteConfirmRule: RateLimitRule | null;
    statsRule: RateLimitRule | null;
    confirmDelete: () => void;
    closeEdit: () => void;
    closeDelete: () => void;
    closeStats: () => void;
}
/**
 * RateLimitRulesTableMobile Component
 *
 * Mobile presenter with card-based layout.
 * Features 44px touch targets and simplified UI.
 *
 * @param props - Component props
 * @returns Rate limit rules table component (mobile)
 */
export declare function RateLimitRulesTableMobile({ className, rules, isLoading, error, onEdit, onDuplicate, onDelete, onToggle, onShowStats, editingRule, deleteConfirmRule, statsRule, confirmDelete, closeEdit, closeDelete, closeStats, }: RateLimitRulesTableMobileProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RateLimitRulesTableMobile.d.ts.map