/**
 * SubnetInput Component
 * Auto-detecting wrapper that renders the appropriate presenter based on platform
 *
 * This is the main export that consumers should use.
 * It automatically detects the platform (mobile/tablet/desktop) and renders
 * the appropriate presenter component.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SubnetInput
 *   value={subnet}
 *   onChange={setSubnet}
 *   label="Network Subnet"
 * />
 *
 * // With overlap detection
 * <SubnetInput
 *   value={subnet}
 *   onChange={setSubnet}
 *   checkOverlap={(cidr) => checkSubnetConflicts(cidr)}
 * />
 *
 * // With React Hook Form
 * <Controller
 *   name="subnet"
 *   control={control}
 *   render={({ field }) => (
 *     <SubnetInput {...field} label="Subnet" />
 *   )}
 * />
 * ```
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import type { SubnetInputProps } from './subnet-input.types';
/**
 * SubnetInput Component
 *
 * A subnet/CIDR input component with network calculations display.
 * Automatically adapts to mobile/desktop platforms.
 *
 * Features:
 * - CIDR notation input (e.g., 192.168.1.0/24)
 * - Real-time subnet calculations (network, broadcast, host range)
 * - Common prefix selector dropdown
 * - Overlap detection integration
 * - Platform-responsive (mobile/desktop)
 * - Full accessibility support
 */
export declare const SubnetInput: import("react").NamedExoticComponent<SubnetInputProps>;
/**
 * ForwardRef version for React Hook Form integration.
 *
 * Note: This wraps the memoized component to allow ref forwarding.
 * Direct ref usage on the main component is not supported due to memo wrapper.
 */
export declare const SubnetInputWithRef: import("react").ForwardRefExoticComponent<SubnetInputProps & import("react").RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=subnet-input.d.ts.map