/**
 * Quick Action Button Component
 *
 * Grid button for common actions on the dashboard.
 * Based on UX Design Specification - Direction 1: Clean Minimal
 *
 * @module @nasnet/ui/patterns/quick-action-button
 */
import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
/**
 * QuickActionButton Props
 */
export interface QuickActionButtonProps {
    /** Icon component from lucide-react */
    icon: LucideIcon;
    /** Button label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Optional badge text or count */
    badge?: string | number;
    /** Badge variant */
    badgeVariant?: 'default' | 'secondary' | 'outline' | 'connected' | 'warning' | 'error' | 'info' | 'offline';
    /** Custom className */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
}
export declare const QuickActionButton: React.MemoExoticComponent<React.ForwardRefExoticComponent<QuickActionButtonProps & React.RefAttributes<HTMLButtonElement>>>;
//# sourceMappingURL=QuickActionButton.d.ts.map