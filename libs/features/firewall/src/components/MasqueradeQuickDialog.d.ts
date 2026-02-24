/**
 * Masquerade Quick Dialog
 *
 * Simple dialog for quickly creating a masquerade rule.
 * Prompts for output interface and optional comment.
 *
 * @description Dialog-based form for creating NAT masquerade rules. Includes
 * interface selection and optional comment field. Provides contextual help text
 * explaining masquerade functionality.
 *
 * @see NAS-7-2: Implement NAT Configuration - Task 9
 */
interface MasqueradeQuickDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to change the open state */
    onOpenChange: (isOpen: boolean) => void;
    /** Router IP address for GraphQL header */
    routerIp: string;
    /** Available WAN interfaces for selection */
    wanInterfaces?: string[];
    /** Callback when masquerade rule is successfully created */
    onSuccess?: () => void;
}
declare function MasqueradeQuickDialogInner({ open, onOpenChange, routerIp, wanInterfaces, onSuccess, }: MasqueradeQuickDialogProps): import("react/jsx-runtime").JSX.Element;
declare namespace MasqueradeQuickDialogInner {
    var displayName: string;
}
export declare const MasqueradeQuickDialog: import("react").MemoExoticComponent<typeof MasqueradeQuickDialogInner>;
export {};
//# sourceMappingURL=MasqueradeQuickDialog.d.ts.map