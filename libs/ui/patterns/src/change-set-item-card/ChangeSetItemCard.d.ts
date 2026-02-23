/**
 * Change Set Item Card Component
 * Displays an individual item in a change set with expand/collapse
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { ChangeSetItem } from '@nasnet/core/types';
declare const cardVariants: (props?: ({
    status?: "APPLYING" | "FAILED" | "ROLLED_BACK" | "PENDING" | "APPLIED" | "ROLLBACK_FAILED" | "SKIPPED" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const operationIndicatorVariants: (props?: ({
    operation?: "CREATE" | "UPDATE" | "DELETE" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ChangeSetItemCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>, VariantProps<typeof cardVariants> {
    /** Change set item data */
    item: ChangeSetItem;
    /** Whether the card is expanded */
    expanded?: boolean;
    /** Callback when expand/collapse is toggled */
    onToggleExpand?: () => void;
    /** Callback when remove is clicked */
    onRemove?: () => void;
    /** Whether the item can be removed */
    removable?: boolean;
    /** Show dependency information */
    showDependencies?: boolean;
    /** Dependency names for display */
    dependencyNames?: Record<string, string>;
    /** Manual platform presenter override: 'mobile' | 'tablet' | 'desktop' */
    presenter?: 'mobile' | 'tablet' | 'desktop';
}
/**
 * Headless hook: handles all business logic for ChangeSetItemCard
 */
export declare function useChangeSetItemCard(item: ChangeSetItem, { expanded, onToggleExpand, onRemove, removable, showDependencies, dependencyNames, }: Omit<ChangeSetItemCardProps, 'className' | 'item'>): {
    canRemove: boolean;
    handleRemove: () => void;
    handleToggleExpand: () => void;
    statusLabel: string;
    expanded: boolean;
    item: ChangeSetItem<Record<string, unknown>>;
    showDependencies: boolean;
    dependencyNames: Record<string, string>;
};
export declare const ChangeSetItemCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<ChangeSetItemCardProps & React.RefAttributes<HTMLDivElement>>>;
export { cardVariants, operationIndicatorVariants };
//# sourceMappingURL=ChangeSetItemCard.d.ts.map