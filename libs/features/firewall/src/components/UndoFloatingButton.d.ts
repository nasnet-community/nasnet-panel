/**
 * UndoFloatingButton Component
 * @description Floating button with countdown for template rollback
 *
 * Features:
 * - 5-minute countdown (300 seconds)
 * - Floating bottom-right position
 * - Confirmation dialog before rollback
 * - Auto-hide after countdown expires
 * - Visual countdown progress
 *
 * @module @nasnet/features/firewall/components
 */
export interface UndoFloatingButtonProps {
    /** Callback when rollback is confirmed */
    onRollback: () => Promise<void>;
    /** Callback when countdown expires */
    onExpire?: () => void;
    /** Whether rollback is in progress */
    isRollingBack?: boolean;
    /** Template name for confirmation message */
    templateName?: string;
    /** Number of rules applied */
    rulesApplied?: number;
}
export declare const UndoFloatingButton: import("react").NamedExoticComponent<UndoFloatingButtonProps>;
//# sourceMappingURL=UndoFloatingButton.d.ts.map