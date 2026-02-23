/**
 * DNS Static Entries List - Desktop Presenter
 *
 * Desktop/tablet optimized view with data table layout.
 *
 * @description
 * Displays static DNS entries in a sortable data table with edit/delete actions.
 * Shows hostname, IP address, TTL, and optional comment for each entry.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import type { DnsStaticEntriesListProps } from './DnsStaticEntriesList';
/**
 * Desktop presenter for DNS static entries list
 *
 * Uses DataTable component with sortable columns.
 * Shows hostname, IP address, TTL, comment, and actions.
 */
export declare function DnsStaticEntriesListDesktop({ entries, onEdit, onDelete, onAdd, isLoading, }: DnsStaticEntriesListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DnsStaticEntriesListDesktop.d.ts.map