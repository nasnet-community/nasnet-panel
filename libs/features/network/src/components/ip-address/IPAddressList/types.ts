/**
 * IPAddressList Component Types
 * NAS-6.2: IP Address Management
 */

/**
 * IP Address data structure from GraphQL/API
 */
export interface IPAddressData {
  id: string;
  address: string;
  network?: string;
  broadcast?: string;
  interface: {
    id: string;
    name: string;
    type?: string;
  };
  disabled: boolean;
  dynamic: boolean;
  invalid: boolean;
  comment?: string;
}

/**
 * Filter options for IP address list
 */
export interface IPAddressFilters {
  /** Filter by interface name */
  interfaceName?: string;
  /** Filter by source type */
  source?: 'static' | 'dynamic' | 'all';
  /** Filter by status */
  status?: 'enabled' | 'disabled' | 'all';
  /** Search text for address or comment */
  searchText?: string;
}

/**
 * Sort options for IP address list
 */
export interface IPAddressSortOptions {
  /** Field to sort by */
  field: 'address' | 'interface' | 'network' | 'comment';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Actions available on each IP address
 */
export interface IPAddressActions {
  /** Callback for editing an IP address */
  onEdit?: (ipAddress: IPAddressData) => void;
  /** Callback for deleting an IP address */
  onDelete?: (ipAddress: IPAddressData) => void;
  /** Callback for toggling disabled state */
  onToggleDisabled?: (ipAddress: IPAddressData) => void;
}

/**
 * Props for IPAddressList component (both Desktop and Mobile)
 */
export interface IPAddressListProps extends IPAddressActions {
  /** List of IP addresses to display */
  ipAddresses: IPAddressData[];
  /** Loading state */
  loading?: boolean;
  /** Error message if query failed */
  error?: string;
  /** Current filter settings */
  filters: IPAddressFilters;
  /** Current sort options */
  sortOptions: IPAddressSortOptions;
  /** Callback when filters change */
  onFiltersChange: (filters: IPAddressFilters) => void;
  /** Callback when sort changes */
  onSortChange: (sortOptions: IPAddressSortOptions) => void;
  /** Callback for refreshing the list */
  onRefresh?: () => void;
}
