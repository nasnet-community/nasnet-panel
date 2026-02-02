/**
 * Port Input Component Types
 *
 * TypeScript interfaces for the port input component following
 * the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */

/**
 * Port input mode - determines the input behavior.
 */
export type PortMode = 'single' | 'range' | 'multi';

/**
 * Protocol type for port context.
 */
export type PortProtocol = 'tcp' | 'udp' | 'both';

/**
 * Port range value for range mode.
 */
export interface PortRange {
  /** Start port of the range */
  start: number;
  /** End port of the range */
  end: number;
}

/**
 * Port suggestion entry for autocomplete.
 */
export interface PortSuggestion {
  /** Port number */
  port: number;
  /** Service name */
  service: string;
  /** Category for grouping */
  category: 'web' | 'secure' | 'database' | 'messaging' | 'mail' | 'network' | 'system' | 'containers' | 'mikrotik' | 'recent';
}

/**
 * Props for the main PortInput component (auto-detecting wrapper).
 */
export interface PortInputProps {
  /** Current value - number for single, string for range/multi */
  value?: number | string;
  /** Called when value changes */
  onChange?: (value: number | string | null) => void;
  /** Input mode: 'single' (default), 'range', or 'multi' */
  mode?: PortMode;
  /** Protocol context for service lookup */
  protocol?: PortProtocol;
  /** Show service name for well-known ports */
  showService?: boolean;
  /** Show suggestions dropdown on focus */
  showSuggestions?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** External error message to display */
  error?: string;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text below input */
  helpText?: string;
  /** Custom minimum port (default: 1) */
  min?: number;
  /** Custom maximum port (default: 65535) */
  max?: number;
  /** Additional CSS classes */
  className?: string;
  /** Form field name */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Called when the input loses focus */
  onBlur?: () => void;
  /** Called when the input gains focus */
  onFocus?: () => void;
  /** ID for the input element (accessibility) */
  id?: string;
  /** Aria-describedby for linking to help text */
  'aria-describedby'?: string;
}

/**
 * Configuration options for the usePortInput hook.
 */
export interface UsePortInputConfig {
  /** Initial or controlled value */
  value?: number | string;
  /** Called when value changes */
  onChange?: (value: number | string | null) => void;
  /** Input mode */
  mode?: PortMode;
  /** Protocol context */
  protocol?: PortProtocol;
  /** Show service lookup */
  showService?: boolean;
  /** Show suggestions */
  showSuggestions?: boolean;
  /** Custom minimum port */
  min?: number;
  /** Custom maximum port */
  max?: number;
}

/**
 * Return value from the usePortInput hook.
 * Contains all state and handlers needed by presenters.
 */
export interface UsePortInputReturn {
  // ============================================================================
  // Parsed Values
  // ============================================================================

  /** Parsed single port value (single mode) */
  port: number | null;
  /** Parsed port range (range mode) */
  portRange: PortRange | null;
  /** Parsed ports array (multi mode) */
  ports: number[];

  // ============================================================================
  // Display Values
  // ============================================================================

  /** Raw input value as string */
  inputValue: string;
  /** Range start input value */
  rangeStartValue: string;
  /** Range end input value */
  rangeEndValue: string;
  /** Formatted display value for read-only display */
  displayValue: string;
  /** Number of ports (1 for single, count for range/multi) */
  portCount: number;

  // ============================================================================
  // Validation State
  // ============================================================================

  /** Whether current input is valid */
  isValid: boolean;
  /** Validation error message */
  error: string | null;

  // ============================================================================
  // Service Lookup
  // ============================================================================

  /** Service name for the current port (single mode) */
  serviceName: string | null;
  /** Current protocol setting */
  protocol: PortProtocol;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /** Handle single input change */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle range start change */
  handleRangeStartChange: (value: string) => void;
  /** Handle range end change */
  handleRangeEndChange: (value: string) => void;
  /** Add a port in multi mode */
  handleAddPort: (port: number) => void;
  /** Remove a port in multi mode */
  handleRemovePort: (port: number) => void;
  /** Handle keydown for keyboard navigation */
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Clear the input */
  clear: () => void;
  /** Handle blur event */
  handleBlur: () => void;
  /** Handle focus event */
  handleFocus: () => void;

  // ============================================================================
  // Suggestions
  // ============================================================================

  /** Available port suggestions */
  suggestions: PortSuggestion[];
  /** Whether suggestions dropdown is visible */
  showSuggestionsDropdown: boolean;
  /** Currently selected suggestion index */
  selectedSuggestionIndex: number;
  /** Select a suggestion */
  handleSelectSuggestion: (port: number) => void;
  /** Open/close suggestions dropdown */
  setShowSuggestionsDropdown: (show: boolean) => void;
  /** Navigate suggestions with arrow keys */
  navigateSuggestion: (direction: 'up' | 'down') => void;

  // ============================================================================
  // Refs
  // ============================================================================

  /** Ref for the main input */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Ref for range start input */
  rangeStartRef: React.RefObject<HTMLInputElement | null>;
  /** Ref for range end input */
  rangeEndRef: React.RefObject<HTMLInputElement | null>;
  /** Ref for suggestions list */
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Props for desktop presenter.
 */
export interface PortInputDesktopProps extends PortInputProps {
  /** Optional override for hook config */
  hookConfig?: UsePortInputConfig;
}

/**
 * Props for mobile presenter.
 */
export interface PortInputMobileProps extends PortInputProps {
  /** Optional override for hook config */
  hookConfig?: UsePortInputConfig;
}

/**
 * Port category type for suggestions grouping.
 */
export type PortCategory = 'web' | 'secure' | 'database' | 'messaging' | 'mail' | 'network' | 'system' | 'containers' | 'mikrotik' | 'recent';

/**
 * Category display names for UI.
 */
export const PORT_CATEGORY_LABELS: Record<PortCategory, string> = {
  web: 'Web Services',
  secure: 'Secure Access',
  database: 'Database',
  messaging: 'Messaging',
  mail: 'Email',
  network: 'Network/VPN',
  system: 'System',
  containers: 'Containers',
  mikrotik: 'MikroTik',
  recent: 'Recent',
};
