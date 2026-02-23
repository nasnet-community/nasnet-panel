/**
 * DNS Server List Component
 *
 * Platform-adaptive component for displaying and managing DNS servers.
 * Supports drag-and-drop reordering, add/remove operations.
 *
 * @description
 * Automatically renders the appropriate presenter (Mobile/Desktop) for managing
 * DNS servers with reordering, addition, and removal capabilities.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
/**
 * DNS Server item
 */
export interface DnsServer {
    /** Unique identifier (IP address for static, or dynamic server ID) */
    id: string;
    /** DNS server IP address */
    address: string;
    /** Whether this is a dynamic server (from DHCP/PPPoE) */
    isDynamic: boolean;
}
/**
 * DNS Server List Props
 */
export interface DnsServerListProps {
    /** Array of DNS servers (static + dynamic) */
    servers: DnsServer[];
    /** Callback when servers are reordered (static servers only) */
    onReorder: (servers: DnsServer[]) => void;
    /** Callback when a static server is removed */
    onRemove: (serverId: string) => void;
    /** Callback to add a new static server */
    onAdd: () => void;
    /** Whether operations are in progress */
    isLoading?: boolean;
    /** Whether data is loading (alias for isLoading) */
    loading?: boolean;
}
/**
 * DNS Server List - Platform-adaptive wrapper
 *
 * Automatically renders the appropriate presenter based on platform:
 * - Mobile: Card layout with touch-optimized controls
 * - Desktop/Tablet: List layout with inline actions
 *
 * Features:
 * - Drag-and-drop reordering (static servers only)
 * - Keyboard navigation support
 * - Dynamic servers display as read-only with badge
 * - Add/remove controls for static servers
 *
 * @example
 * ```tsx
 * <DnsServerList
 *   servers={[
 *     { id: '1.1.1.1', address: '1.1.1.1', isDynamic: false },
 *     { id: '192.168.1.1', address: '192.168.1.1', isDynamic: true },
 *   ]}
 *   onReorder={handleReorder}
 *   onRemove={handleRemove}
 *   onAdd={handleAdd}
 * />
 * ```
 */
export declare const DnsServerList: import("react").NamedExoticComponent<DnsServerListProps>;
//# sourceMappingURL=DnsServerList.d.ts.map