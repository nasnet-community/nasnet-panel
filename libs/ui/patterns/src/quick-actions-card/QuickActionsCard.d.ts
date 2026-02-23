/**
 * Quick Actions Card Component
 *
 * 2x2 grid of action buttons for quick access to common features.
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @module @nasnet/ui/patterns/quick-actions-card
 */
import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
/**
 * Quick action item configuration
 */
export interface QuickAction {
    /** Unique identifier */
    id: string;
    /** Icon component from lucide-react */
    icon: LucideIcon;
    /** Button label */
    label: string;
    /** Sublabel/description */
    sublabel?: string;
    /** Click handler */
    onClick: () => void;
    /** Variant: primary (highlighted), default (normal) */
    variant?: 'primary' | 'default';
    /** Disabled state */
    disabled?: boolean;
}
/**
 * QuickActionsCard Props
 */
export interface QuickActionsCardProps {
    /** Array of quick actions (typically 4 for 2x2 grid) */
    actions: QuickAction[];
    /** Optional title above the actions */
    title?: string;
    /** Custom className */
    className?: string;
}
export declare const QuickActionsCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<QuickActionsCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=QuickActionsCard.d.ts.map