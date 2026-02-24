/**
 * IPAddressDisplay Component
 *
 * Reusable component for displaying IP addresses with context menu integration.
 * Allows quick-add to address lists via right-click (desktop) or long-press (mobile).
 *
 * Layer 3 Domain Component
 *
 * @description Displays IP addresses in badge or text format with optional context menu for
 * adding to address lists. Supports both desktop (right-click) and mobile (long-press) interactions.
 * Accessible with keyboard support (Shift+F10 for context menu trigger).
 *
 * @module @nasnet/features/firewall/components
 */
export interface IPAddressDisplayProps {
    /** The IP address to display (e.g., "192.168.1.100") */
    ipAddress: string;
    /** Optional label to show before the IP */
    label?: string;
    /** Show as badge (default) or plain text */
    variant?: 'badge' | 'text';
    /** Existing address lists for quick-add */
    existingLists?: string[];
    /** Callback when IP is added to a list */
    onAddToList?: (listName: string, ipAddress: string) => void | Promise<void>;
    /** Whether to show the context menu (default: true) */
    showContextMenu?: boolean;
    /** Optional className for styling */
    className?: string;
}
/**
 * Display IP address with context menu for adding to address lists
 *
 * @example
 * ```tsx
 * <IPAddressDisplay
 *   ipAddress="192.168.1.100"
 *   label="Source"
 *   existingLists={['blocklist', 'allowlist']}
 *   onAddToList={handleAddToList}
 * />
 * ```
 */
declare function IPAddressDisplayInner({ ipAddress, label, variant, existingLists, onAddToList, showContextMenu, className, }: IPAddressDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace IPAddressDisplayInner {
    var displayName: string;
}
export declare const IPAddressDisplay: import("react").MemoExoticComponent<typeof IPAddressDisplayInner>;
export {};
//# sourceMappingURL=IPAddressDisplay.d.ts.map