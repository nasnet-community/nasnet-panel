/**
 * IPAddressList Pattern Component
 * NAS-6.2: IP Address Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @description Platform-aware component that renders IP address list with
 * automatic mobile (card-based) or desktop (table) layout selection.
 *
 * @example
 * ```tsx
 * <IPAddressList
 *   ipAddresses={ipAddresses}
 *   loading={loading}
 *   filters={filters}
 *   sortOptions={sortOptions}
 *   onFiltersChange={setFilters}
 *   onSortChange={setSortOptions}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
import type { IPAddressListProps } from './types';
/**
 * IPAddressList - Display and manage IP addresses on interfaces
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based layout with 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with filtering and sorting
 */
declare function IPAddressListComponent(props: IPAddressListProps): import("react/jsx-runtime").JSX.Element;
export declare const IPAddressList: import("react").MemoExoticComponent<typeof IPAddressListComponent>;
export {};
//# sourceMappingURL=IPAddressList.d.ts.map