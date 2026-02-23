/**
 * DNS Server List - Desktop Presenter
 *
 * Desktop/tablet optimized view with:
 * - Drag-and-drop reordering
 * - Inline action buttons
 * - Compact list layout
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import type { DnsServerListProps } from './DnsServerList';
/**
 * Desktop presenter for DNS server list
 *
 * Uses SortableListWithActions for drag-and-drop reordering.
 * Static servers can be reordered and removed.
 * Dynamic servers are read-only with "Dynamic" badge.
 */
export declare function DnsServerListDesktop({ servers, onReorder, onRemove, onAdd, isLoading, }: DnsServerListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DnsServerListDesktop.d.ts.map