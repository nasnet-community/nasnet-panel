export interface BatchActionsToolbarProps {
    /** Router ID for API requests */
    routerId: string;
    /** Set of selected interface IDs */
    selectedIds: Set<string>;
    /** Full interface objects for safety checks and context */
    selectedInterfaces: any[];
    /** Callback to clear the current selection */
    onClearSelection: () => void;
}
/**
 * Batch Actions Toolbar Component.
 *
 * Provides bulk enable/disable operations on selected interfaces with safety
 * checks via confirmation dialog and comprehensive error handling.
 *
 * @description Toolbar for batch interface operations with confirmation and status feedback
 */
export declare const BatchActionsToolbar: import("react").NamedExoticComponent<BatchActionsToolbarProps>;
//# sourceMappingURL=BatchActionsToolbar.d.ts.map