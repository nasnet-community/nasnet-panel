/**
 * useSubnetInput Hook
 * Headless hook for subnet/CIDR input logic
 *
 * Implements all validation, parsing, and calculation logic
 * following the Headless + Platform Presenter pattern (ADR-018).
 *
 * @example
 * ```tsx
 * const state = useSubnetInput({
 *   value: '192.168.1.0/24',
 *   onChange: (cidr) => console.log(cidr),
 *   checkOverlap: (cidr) => checkSubnetConflicts(cidr),
 * });
 * ```
 */
import type { SubnetInputProps, UseSubnetInputReturn, PrefixOption } from './subnet-input.types';
/**
 * Common CIDR prefix options for the selector
 * Ordered by most commonly used in networking
 */
export declare const COMMON_PREFIX_OPTIONS: PrefixOption[];
/**
 * Headless hook for subnet/CIDR input
 *
 * Handles:
 * - CIDR parsing and validation
 * - Subnet calculations (network, broadcast, host range)
 * - Overlap detection via callback
 * - Controlled/uncontrolled modes
 *
 * @param props - SubnetInput props
 * @returns Hook state and methods
 */
export declare function useSubnetInput(props: Pick<SubnetInputProps, 'value' | 'onChange' | 'checkOverlap' | 'error'>): UseSubnetInputReturn;
//# sourceMappingURL=use-subnet-input.d.ts.map