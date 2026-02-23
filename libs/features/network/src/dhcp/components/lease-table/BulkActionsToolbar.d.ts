/**
 * BulkActionsToolbar Component
 *
 * Toolbar for bulk operations on selected DHCP leases:
 * - Shows selection count
 * - "Make All Static" button
 * - "Delete Selected" button
 * - "Clear" button to deselect all
 *
 * Uses ConfirmationDialog for destructive actions.
 *
 * @module features/network/dhcp/components/lease-table
 */
export interface BulkActionsToolbarProps {
    /**
     * Number of selected leases
     */
    selectedCount: number;
    /**
     * Callback for "Make All Static" action
     */
    onMakeStatic: () => void;
    /**
     * Callback for "Delete Selected" action
     */
    onDelete: () => void;
    /**
     * Callback for "Clear" action (deselect all)
     */
    onClear: () => void;
    /**
     * Loading state for async operations
     */
    isLoading?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * BulkActionsToolbar Component
 *
 * Displays action buttons when leases are selected.
 * Shows confirmation dialog for destructive operations.
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={5}
 *   onMakeStatic={handleMakeStatic}
 *   onDelete={handleDelete}
 *   onClear={handleClear}
 * />
 * ```
 */
declare function BulkActionsToolbarComponent({ selectedCount, onMakeStatic, onDelete, onClear, isLoading, className, }: BulkActionsToolbarProps): import("react/jsx-runtime").JSX.Element | null;
export declare const BulkActionsToolbar: import("react").MemoExoticComponent<typeof BulkActionsToolbarComponent>;
export {};
//# sourceMappingURL=BulkActionsToolbar.d.ts.map