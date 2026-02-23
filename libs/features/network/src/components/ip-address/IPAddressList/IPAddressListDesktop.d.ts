/**
 * IPAddressListDesktop - Desktop/Tablet Presenter
 * NAS-6.2: IP Address Management
 *
 * Dense table layout optimized for mouse/keyboard interaction.
 * Uses DataTable with sorting, filtering, and row actions.
 *
 * @description Desktop/tablet presenter for IP address list with data table,
 * filtering, sorting, and dropdown action menu for each row.
 */
import type { IPAddressListProps } from './types';
declare function IPAddressListDesktopComponent({ ipAddresses, loading, error, filters, sortOptions, onFiltersChange, onSortChange, onEdit, onDelete, onToggleDisabled, onRefresh, }: IPAddressListProps): import("react/jsx-runtime").JSX.Element;
export declare const IPAddressListDesktop: import("react").MemoExoticComponent<typeof IPAddressListDesktopComponent>;
export {};
//# sourceMappingURL=IPAddressListDesktop.d.ts.map