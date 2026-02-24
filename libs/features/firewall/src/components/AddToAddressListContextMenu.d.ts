/**
 * AddToAddressListContextMenu Component
 *
 * Context menu for quickly adding IP addresses to address lists.
 * Desktop: Right-click context menu with nested list selection.
 * Mobile: Handled by IPAddressDisplay with Sheet.
 *
 * Layer 3 Domain Component
 *
 * @description Provides a context menu overlay for adding IPs to existing address lists
 * or creating new ones. Supports keyboard navigation and Enter to submit.
 *
 * @module @nasnet/features/firewall/components
 */
export interface AddToAddressListContextMenuProps {
    /** The IP address to add (e.g., "192.168.1.100") */
    ipAddress: string;
    /** Existing address lists for quick-add */
    existingLists?: string[];
    /** Callback when IP is added to a list */
    onAddToList?: (listName: string, ipAddress: string) => void | Promise<void>;
    /** Child element that triggers the context menu */
    children: React.ReactNode;
}
/**
 * Context menu for adding IP to address lists
 *
 * @example
 * ```tsx
 * <AddToAddressListContextMenu
 *   ipAddress="192.168.1.100"
 *   existingLists={['blocklist', 'allowlist']}
 *   onAddToList={handleAddToList}
 * >
 *   <span className="font-mono">192.168.1.100</span>
 * </AddToAddressListContextMenu>
 * ```
 */
declare function AddToAddressListContextMenuInner({ ipAddress, existingLists, onAddToList, children, }: AddToAddressListContextMenuProps): import("react/jsx-runtime").JSX.Element;
declare namespace AddToAddressListContextMenuInner {
    var displayName: string;
}
export declare const AddToAddressListContextMenu: import("react").MemoExoticComponent<typeof AddToAddressListContextMenuInner>;
export {};
//# sourceMappingURL=AddToAddressListContextMenu.d.ts.map