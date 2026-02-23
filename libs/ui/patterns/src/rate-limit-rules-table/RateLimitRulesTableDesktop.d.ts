/**
 * Rate Limit Rules Table - Desktop Presenter
 * Dense data table layout with drag-drop reordering
 *
 * Features:
 * - Drag-drop reordering using dnd-kit
 * - Inline enable/disable toggle
 * - Action badges with semantic colors
 * - Counter visualization (triggered count)
 * - Disabled rules styling (opacity-50)
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitRule } from '@nasnet/core/types';
import type { RateLimitRulesTablePresenterProps } from './types';
export interface RateLimitRulesTableDesktopProps extends Omit<RateLimitRulesTablePresenterProps, 'pollingInterval'> {
    editingRule: RateLimitRule | null;
    deleteConfirmRule: RateLimitRule | null;
    statsRule: RateLimitRule | null;
    confirmDelete: () => void;
    closeEdit: () => void;
    closeDelete: () => void;
    closeStats: () => void;
}
/**
 * RateLimitRulesTableDesktop Component
 *
 * Desktop presenter with dense data table layout.
 * Features drag-drop reordering, inline toggles, and action badges.
 *
 * @param props - Component props
 * @returns Rate limit rules table component (desktop)
 */
export declare function RateLimitRulesTableDesktop({ className, rules, isLoading, error, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats, onReorder, editingRule, deleteConfirmRule, statsRule, confirmDelete, closeEdit, closeDelete, closeStats, }: RateLimitRulesTableDesktopProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RateLimitRulesTableDesktop.d.ts.map