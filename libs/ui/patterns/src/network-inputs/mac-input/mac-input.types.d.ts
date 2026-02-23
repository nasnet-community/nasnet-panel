/**
 * MAC Address Input Component Types
 *
 * TypeScript interfaces for the MAC address input component following
 * the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */
/**
 * MAC address output format options.
 */
export type MACFormat = 'colon' | 'dash' | 'dot';
/**
 * Props for the main MACInput component (auto-detecting wrapper).
 */
export interface MACInputProps {
    /** Current MAC address value */
    value?: string;
    /** Called when the MAC address value changes */
    onChange?: (value: string) => void;
    /** Output format: 'colon' (AA:BB:CC:DD:EE:FF), 'dash' (AA-BB-CC-DD-EE-FF), 'dot' (AABB.CCDD.EEFF) */
    format?: MACFormat;
    /** Show vendor lookup from OUI prefix */
    showVendor?: boolean;
    /** Disable the input */
    disabled?: boolean;
    /** External error message to display */
    error?: string;
    /** Label text for the input */
    label?: string;
    /** Placeholder text for empty state */
    placeholder?: string;
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
 * Configuration options for the useMACInput hook.
 */
export interface UseMACInputConfig {
    /** Initial or controlled MAC address value */
    value?: string;
    /** Called when the MAC address value changes */
    onChange?: (value: string) => void;
    /** Output format: 'colon' (default), 'dash', or 'dot' */
    format?: MACFormat;
    /** Enable vendor lookup from OUI prefix */
    showVendor?: boolean;
}
/**
 * Return value from the useMACInput hook.
 * Contains all state and handlers needed by presenters.
 */
export interface UseMACInputReturn {
    /** The complete MAC address string (normalized to format) */
    value: string;
    /** Whether the current value is a valid MAC address */
    isValid: boolean;
    /** Validation error message, if any */
    error: string | null;
    /** Vendor name from OUI lookup, if showVendor is enabled */
    vendor: string | null;
    /** Handle input change with normalization */
    handleChange: (input: string) => void;
    /** Set the complete MAC value directly */
    setValue: (value: string) => void;
}
/**
 * Props for desktop presenter (extends MACInputProps).
 */
export interface MACInputDesktopProps extends MACInputProps {
    /** Optional override for hook config */
    hookConfig?: UseMACInputConfig;
}
/**
 * Props for mobile presenter (extends MACInputProps).
 */
export interface MACInputMobileProps extends MACInputProps {
    /** Optional override for hook config */
    hookConfig?: UseMACInputConfig;
}
//# sourceMappingURL=mac-input.types.d.ts.map