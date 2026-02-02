/**
 * SubnetInput Component Types
 * TypeScript interfaces for the Subnet/CIDR input component
 *
 * @see ADR-018: Headless + Platform Presenters
 */

/**
 * Result of subnet overlap check
 */
export interface OverlapResult {
  /** The CIDR that overlaps with the current input */
  overlappingCidr: string;
  /** Human-readable name of the conflicting resource */
  resourceName: string;
  /** Type of resource (e.g., "DHCP Pool", "Interface", "Route") */
  resourceType: string;
}

/**
 * Subnet information calculated from CIDR notation
 */
export interface SubnetInfo {
  /** Network address (e.g., "192.168.1.0") */
  network: string;
  /** First usable host address (e.g., "192.168.1.1") */
  firstHost: string | null;
  /** Last usable host address (e.g., "192.168.1.254") */
  lastHost: string | null;
  /** Broadcast address (e.g., "192.168.1.255") */
  broadcast: string;
  /** Number of usable host addresses */
  hostCount: number;
  /** CIDR prefix length (0-32) */
  prefix: number;
  /** Subnet mask in dotted decimal notation */
  mask: string;
}

/**
 * Common CIDR prefix option for the selector dropdown
 */
export interface PrefixOption {
  /** Prefix value (e.g., 24) */
  prefix: number;
  /** Subnet mask (e.g., "255.255.255.0") */
  mask: string;
  /** Number of usable hosts */
  hosts: number;
  /** Common use case description */
  description: string;
}

/**
 * Props for the SubnetInput component
 */
export interface SubnetInputProps {
  /** Current CIDR value (e.g., "192.168.1.0/24") */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Whether to show the calculations panel */
  showCalculations?: boolean;
  /** Callback to check for subnet overlap with other resources */
  checkOverlap?: (cidr: string) => OverlapResult | null;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** External error message */
  error?: string;
  /** Label text for the input */
  label?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Placeholder text for the IP portion */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** ID for the input element */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when input loses focus */
  onBlur?: () => void;
}

/**
 * Return type for the useSubnetInput hook
 */
export interface UseSubnetInputReturn {
  /** Full CIDR value (e.g., "192.168.1.0/24") */
  value: string;
  /** IP address portion of the CIDR */
  ipPart: string;
  /** Prefix length portion of the CIDR (0-32) */
  prefixPart: number;
  /** Whether the current CIDR is valid */
  isValid: boolean;
  /** Validation error message, if any */
  error: string | null;
  /** Calculated subnet information, or null if invalid */
  networkInfo: SubnetInfo | null;
  /** Overlap detection result, or null if no overlap */
  overlap: OverlapResult | null;
  /** Set the IP address portion */
  setIP: (ip: string) => void;
  /** Set the prefix length */
  setPrefix: (prefix: number) => void;
  /** Set the full CIDR value */
  setValue: (cidr: string) => void;
  /** Clear the input */
  clear: () => void;
  /** Common prefix options for the selector */
  prefixOptions: PrefixOption[];
}

/**
 * Props for the subnet calculations display component
 */
export interface SubnetCalculationsProps {
  /** Subnet information to display */
  info: SubnetInfo;
  /** Whether the display is collapsed (mobile) */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the prefix selector dropdown
 */
export interface PrefixSelectorProps {
  /** Current prefix value */
  value: number;
  /** Callback when prefix changes */
  onChange: (prefix: number) => void;
  /** Available prefix options */
  options: PrefixOption[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the overlap warning component
 */
export interface OverlapWarningProps {
  /** Overlap information */
  overlap: OverlapResult;
  /** Callback when user clicks to see details */
  onShowDetails?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for platform-specific presenters
 */
export interface SubnetInputPresenterProps extends SubnetInputProps {
  /** Headless hook return value */
  state: UseSubnetInputReturn;
  /** Whether to show the overlap warning */
  showOverlap?: boolean;
}
