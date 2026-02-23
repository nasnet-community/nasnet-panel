/**
 * usePortInput - Headless Port Input Hook
 *
 * Contains all business logic for port input validation, parsing,
 * service lookup, and suggestions. Used by both desktop and mobile presenters.
 *
 * Features:
 * - Single port validation (1-65535)
 * - Port range validation (start ≤ end)
 * - Multi-port parsing with deduplication
 * - Service name lookup from well-known ports database
 * - Suggestions with category grouping
 * - Session-based recent ports tracking
 *
 * @module @nasnet/ui/patterns/network-inputs/port-input
 */
import type { PortMode, PortRange, UsePortInputConfig, UsePortInputReturn } from './port-input.types';
/**
 * Check if a port number is valid within the given bounds.
 */
export declare function isValidPort(port: number, min?: number, max?: number): boolean;
/**
 * Parse a single port from string input.
 * Returns null if invalid.
 */
export declare function parseSinglePort(input: string, min?: number, max?: number): number | null;
/**
 * Parse a port range from string input (e.g., "8080-8090").
 * Returns null if invalid.
 */
export declare function parsePortRange(input: string, min?: number, max?: number): PortRange | null;
/**
 * Parse multiple ports from comma-separated string input.
 * Returns array of valid ports, deduplicates, and sorts.
 */
export declare function parseMultiPorts(input: string, min?: number, max?: number): number[];
/**
 * Get validation error message for a port input.
 */
export declare function getPortValidationError(input: string, mode: PortMode, min?: number, max?: number): string | null;
/**
 * Format a port value for display.
 */
export declare function formatPortDisplay(value: number | PortRange | number[] | null, mode: PortMode, serviceName?: string | null): string;
/**
 * Headless hook for port input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for port input presenters
 */
export declare function usePortInput(config?: UsePortInputConfig): UsePortInputReturn;
export default usePortInput;
//# sourceMappingURL=use-port-input.d.ts.map