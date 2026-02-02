/**
 * Interface Selector Component Types
 *
 * TypeScript interfaces for the interface selector component following
 * the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

/**
 * Router interface types based on MikroTik interface classification.
 * Maps to common RouterOS interface types.
 */
export type InterfaceType =
  | 'ethernet'
  | 'bridge'
  | 'vlan'
  | 'wireless'
  | 'vpn'
  | 'tunnel'
  | 'loopback';

/**
 * Interface operational status.
 */
export type InterfaceStatus = 'up' | 'down' | 'disabled';

/**
 * Router interface data structure.
 * Represents a single network interface from the router.
 */
export interface RouterInterface {
  /** Unique identifier for the interface */
  id: string;
  /** Interface name (e.g., ether1, bridge-lan, wlan1) */
  name: string;
  /** Interface type classification */
  type: InterfaceType;
  /** Current operational status */
  status: InterfaceStatus;
  /** IP address assigned to the interface (if any) */
  ip?: string;
  /** MAC address of the interface */
  mac?: string;
  /** List of resources using this interface (e.g., "DHCP Server", "bridge-lan") */
  usedBy?: string[];
  /** User-defined comment/description */
  comment?: string;
}

/**
 * Props for the main InterfaceSelector component (auto-detecting wrapper).
 */
export interface InterfaceSelectorProps {
  /** Router ID to fetch interfaces for */
  routerId: string;
  /** Current selected value (single ID or array of IDs) */
  value?: string | string[];
  /** Callback when selection changes */
  onChange?: (value: string | string[]) => void;
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Restrict to specific interface types */
  types?: InterfaceType[];
  /** Show status indicator for each interface (default: true) */
  showStatus?: boolean;
  /** Show IP address for each interface (default: true) */
  showIP?: boolean;
  /** Hide interfaces that are already in use elsewhere */
  excludeUsed?: boolean;
  /** Disable the selector */
  disabled?: boolean;
  /** External error message to display */
  error?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Label for the selector */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** ID for the selector element (accessibility) */
  id?: string;
  /** Aria-describedby for linking to help text */
  'aria-describedby'?: string;
}

/**
 * Return value from the useInterfaceSelector hook.
 * Contains all state and handlers needed by presenters.
 */
export interface UseInterfaceSelectorReturn {
  /** All interfaces from subscription */
  interfaces: RouterInterface[];
  /** Filtered interfaces based on type, search, and excludeUsed */
  filteredInterfaces: RouterInterface[];
  /** Currently selected interface IDs (normalized to array) */
  selectedValues: string[];
  /** Whether data is still loading */
  isLoading: boolean;
  /** Error from subscription, if any */
  error: Error | null;
  /** Current search query */
  searchQuery: string;
  /** Current type filter */
  typeFilter: InterfaceType | 'all';
  /** Whether the dropdown/sheet is open */
  isOpen: boolean;
  /** Update search query */
  setSearchQuery: (query: string) => void;
  /** Update type filter */
  setTypeFilter: (type: InterfaceType | 'all') => void;
  /** Set open state */
  setIsOpen: (open: boolean) => void;
  /** Toggle selection of an interface */
  toggleSelection: (id: string) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Get interface by ID */
  getInterfaceById: (id: string) => RouterInterface | undefined;
  /** Get display text for current selection */
  getDisplayValue: () => string;
  /** Retry fetching interfaces (for error state) */
  retry: () => void;
}

/**
 * Props for desktop presenter (extends InterfaceSelectorProps).
 */
export interface InterfaceSelectorDesktopProps extends InterfaceSelectorProps {
  /** Optional override for hook return value (for testing) */
  hookOverride?: Partial<UseInterfaceSelectorReturn>;
}

/**
 * Props for mobile presenter (extends InterfaceSelectorProps).
 */
export interface InterfaceSelectorMobileProps extends InterfaceSelectorProps {
  /** Optional override for hook return value (for testing) */
  hookOverride?: Partial<UseInterfaceSelectorReturn>;
}

/**
 * Props for individual interface item component.
 */
export interface InterfaceItemProps {
  /** Interface data */
  interface: RouterInterface;
  /** Whether this interface is currently selected */
  selected: boolean;
  /** Callback when interface is clicked/selected */
  onSelect: () => void;
  /** Show checkbox (for multi-select mode) */
  showCheckbox?: boolean;
  /** Show status indicator */
  showStatus?: boolean;
  /** Show IP address */
  showIP?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for interface type icon component.
 */
export interface InterfaceTypeIconProps {
  /** Interface type to show icon for */
  type: InterfaceType;
  /** Additional CSS classes */
  className?: string;
  /** Size of the icon (default: 5) */
  size?: number;
}

/**
 * Props for type filter dropdown component.
 */
export interface InterfaceTypeFilterProps {
  /** Current filter value */
  value: InterfaceType | 'all';
  /** Callback when filter changes */
  onChange: (type: InterfaceType | 'all') => void;
  /** Available types to filter by (if restricted) */
  availableTypes?: InterfaceType[];
  /** Additional CSS classes */
  className?: string;
}
