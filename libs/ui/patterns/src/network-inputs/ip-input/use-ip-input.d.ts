/**
 * useIPInput Hook - Headless IP Address Input Logic
 *
 * Contains all business logic for the IP address input component:
 * - Segment state management (4 for IPv4, 8 for IPv6)
 * - Validation using Zod schemas
 * - Auto-advance on '.' or 3 digits
 * - Paste handling with IP extraction
 * - Keyboard navigation (Tab, Arrow, Backspace, Home, End)
 * - IP type classification
 * - CIDR suffix handling
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */
import type { UseIPInputConfig, UseIPInputReturn, IPType } from './ip-input.types';
/**
 * Validates if a string is a valid IPv4 octet (0-255, no leading zeros).
 */
export declare function isValidOctet(value: string): boolean;
/**
 * Validates if a string is a valid IPv4 address.
 */
export declare function isValidIPv4(ip: string): boolean;
/**
 * Validates if a string is a valid IPv6 address.
 * Simplified validation - accepts standard format.
 */
export declare function isValidIPv6(ip: string): boolean;
/**
 * Validates if a CIDR prefix is valid for the given IP version.
 */
export declare function isValidCIDRPrefix(prefix: string, version: 'v4' | 'v6'): boolean;
/**
 * Classifies an IPv4 address into its type.
 *
 * @param ip - The IPv4 address to classify
 * @returns The IP type or null if invalid
 */
export declare function classifyIP(ip: string): IPType | null;
/**
 * Gets a human-readable label for an IP type.
 */
export declare function getIPTypeLabel(type: IPType): string;
/**
 * Headless hook for IP address input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for IP input component
 */
export declare function useIPInput(config?: UseIPInputConfig): UseIPInputReturn;
//# sourceMappingURL=use-ip-input.d.ts.map