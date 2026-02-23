/**
 * DNS Server List - Mobile Presenter
 *
 * Mobile optimized view with:
 * - Card layout
 * - Touch-optimized controls (44px minimum)
 * - Simplified UI
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import type { DnsServerListProps } from './DnsServerList';
/**
 * Mobile presenter for DNS server list
 *
 * Simplified card-based layout optimized for touch interaction.
 * Note: Full drag-and-drop on mobile can be handled by SortableListWithActions
 * but for simplicity, we show a visual indicator and handle reordering via touch.
 */
export declare function DnsServerListMobile({ servers, onReorder, onRemove, onAdd, isLoading, }: DnsServerListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DnsServerListMobile.d.ts.map