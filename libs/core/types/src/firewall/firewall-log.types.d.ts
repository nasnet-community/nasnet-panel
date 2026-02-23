import { z } from 'zod';
import type { LogEntry } from '../router/logs';
/**
 * Firewall Log Types and Schemas
 *
 * Defines types for firewall log entries with parsed fields from RouterOS firewall logs.
 * Extends the base LogEntry interface with firewall-specific data.
 *
 * Firewall logs contain information about packets matched by firewall rules,
 * including source/destination IPs and ports, protocols, interfaces, and actions taken.
 *
 * @see libs/core/types/src/router/logs.ts - Base LogEntry interface
 */
/**
 * Zod schema for firewall log chain validation
 * Validates that chain is one of: input, forward, or output
 *
 * @see FirewallLogChain - Type inferred from this schema
 *
 * @example
 * const result = FirewallLogChainSchema.parse('forward');
 * // result: 'forward'
 */
export declare const FirewallLogChainSchema: z.ZodEnum<["input", "forward", "output"]>;
/**
 * Type for firewall log chain
 * @example
 * const chain: FirewallLogChain = 'forward';
 */
export type FirewallLogChain = z.infer<typeof FirewallLogChainSchema>;
/**
 * Zod schema for inferred firewall action validation
 * Validates that action is one of: accept, drop, reject, or unknown
 *
 * @see InferredAction - Type inferred from this schema
 *
 * @example
 * const result = InferredActionSchema.parse('drop');
 * // result: 'drop'
 */
export declare const InferredActionSchema: z.ZodEnum<["accept", "drop", "reject", "unknown"]>;
/**
 * Type for inferred firewall action
 * @example
 * const action: InferredAction = 'drop';
 */
export type InferredAction = z.infer<typeof InferredActionSchema>;
/**
 * Zod schema for firewall log protocol validation
 * Validates that protocol is one of: TCP, UDP, ICMP, IPv6-ICMP, GRE, ESP, AH, IGMP, or unknown
 *
 * @see FirewallLogProtocol - Type inferred from this schema
 *
 * @example
 * const result = FirewallLogProtocolSchema.parse('TCP');
 * // result: 'TCP'
 */
export declare const FirewallLogProtocolSchema: z.ZodEnum<["TCP", "UDP", "ICMP", "IPv6-ICMP", "GRE", "ESP", "AH", "IGMP", "unknown"]>;
/**
 * Type for firewall log protocol
 * @example
 * const protocol: FirewallLogProtocol = 'TCP';
 */
export type FirewallLogProtocol = z.infer<typeof FirewallLogProtocolSchema>;
/**
 * Parsed firewall log data extracted from RouterOS log message
 */
export interface ParsedFirewallLog {
    /**
     * Chain where packet was logged (input/forward/output)
     */
    chain: FirewallLogChain;
    /**
     * Inferred action from log prefix or rule
     */
    action: InferredAction;
    /**
     * Source IP address
     */
    srcIp?: string;
    /**
     * Source port (for TCP/UDP)
     */
    srcPort?: number;
    /**
     * Destination IP address
     */
    dstIp?: string;
    /**
     * Destination port (for TCP/UDP)
     */
    dstPort?: number;
    /**
     * Network protocol
     */
    protocol: FirewallLogProtocol;
    /**
     * Input interface name
     */
    interfaceIn?: string;
    /**
     * Output interface name
     */
    interfaceOut?: string;
    /**
     * Log prefix from firewall rule
     */
    prefix?: string;
    /**
     * Packet length in bytes
     */
    length?: number;
}
/**
 * Firewall log entry extending base LogEntry with parsed firewall data
 */
export interface FirewallLogEntry extends LogEntry {
    /**
     * Topic is always 'firewall' for firewall logs
     */
    topic: 'firewall';
    /**
     * Parsed firewall-specific data from log message
     */
    parsed: ParsedFirewallLog;
}
/**
 * Zod schema for parsed firewall log data validation
 * Validates all fields with proper IPv4/port formats and ranges
 *
 * @see ParsedFirewallLog - Interface for parsed firewall log data
 *
 * @example
 * const parsed = {
 *   chain: 'forward',
 *   action: 'drop',
 *   srcIp: '192.168.1.100',
 *   srcPort: 54321,
 * };
 * const result = ParsedFirewallLogSchema.parse(parsed);
 */
export declare const ParsedFirewallLogSchema: z.ZodObject<{
    chain: z.ZodEnum<["input", "forward", "output"]>;
    action: z.ZodEnum<["accept", "drop", "reject", "unknown"]>;
    srcIp: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    srcPort: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
    dstIp: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dstPort: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
    protocol: z.ZodEnum<["TCP", "UDP", "ICMP", "IPv6-ICMP", "GRE", "ESP", "AH", "IGMP", "unknown"]>;
    interfaceIn: z.ZodOptional<z.ZodString>;
    interfaceOut: z.ZodOptional<z.ZodString>;
    prefix: z.ZodOptional<z.ZodString>;
    length: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    action: "accept" | "unknown" | "drop" | "reject";
    protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
    chain: "input" | "output" | "forward";
    length?: number | undefined;
    prefix?: string | undefined;
    srcPort?: number | undefined;
    dstPort?: number | undefined;
    srcIp?: string | undefined;
    dstIp?: string | undefined;
    interfaceIn?: string | undefined;
    interfaceOut?: string | undefined;
}, {
    action: "accept" | "unknown" | "drop" | "reject";
    protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
    chain: "input" | "output" | "forward";
    length?: number | undefined;
    prefix?: string | undefined;
    srcPort?: number | undefined;
    dstPort?: number | undefined;
    srcIp?: string | undefined;
    dstIp?: string | undefined;
    interfaceIn?: string | undefined;
    interfaceOut?: string | undefined;
}>;
/**
 * Zod schema for complete firewall log entry validation
 * Combines base log entry fields with parsed firewall-specific data
 *
 * @see FirewallLogEntry - Interface for complete firewall log entry
 *
 * @example
 * const entry = {
 *   id: '*0',
 *   timestamp: new Date(),
 *   topic: 'firewall',
 *   severity: 'info',
 *   message: 'input: in:ether1 out:(unknown 0), proto TCP',
 *   parsed: { chain: 'input', action: 'drop', protocol: 'TCP' },
 * };
 * const result = FirewallLogEntrySchema.parse(entry);
 */
export declare const FirewallLogEntrySchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodDate;
    topic: z.ZodLiteral<"firewall">;
    severity: z.ZodEnum<["debug", "info", "warning", "error", "critical"]>;
    message: z.ZodString;
    parsed: z.ZodObject<{
        chain: z.ZodEnum<["input", "forward", "output"]>;
        action: z.ZodEnum<["accept", "drop", "reject", "unknown"]>;
        srcIp: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        srcPort: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
        dstIp: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        dstPort: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
        protocol: z.ZodEnum<["TCP", "UDP", "ICMP", "IPv6-ICMP", "GRE", "ESP", "AH", "IGMP", "unknown"]>;
        interfaceIn: z.ZodOptional<z.ZodString>;
        interfaceOut: z.ZodOptional<z.ZodString>;
        prefix: z.ZodOptional<z.ZodString>;
        length: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        action: "accept" | "unknown" | "drop" | "reject";
        protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
        chain: "input" | "output" | "forward";
        length?: number | undefined;
        prefix?: string | undefined;
        srcPort?: number | undefined;
        dstPort?: number | undefined;
        srcIp?: string | undefined;
        dstIp?: string | undefined;
        interfaceIn?: string | undefined;
        interfaceOut?: string | undefined;
    }, {
        action: "accept" | "unknown" | "drop" | "reject";
        protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
        chain: "input" | "output" | "forward";
        length?: number | undefined;
        prefix?: string | undefined;
        srcPort?: number | undefined;
        dstPort?: number | undefined;
        srcIp?: string | undefined;
        dstIp?: string | undefined;
        interfaceIn?: string | undefined;
        interfaceOut?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    message: string;
    timestamp: Date;
    severity: "error" | "warning" | "info" | "critical" | "debug";
    topic: "firewall";
    parsed: {
        action: "accept" | "unknown" | "drop" | "reject";
        protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
        chain: "input" | "output" | "forward";
        length?: number | undefined;
        prefix?: string | undefined;
        srcPort?: number | undefined;
        dstPort?: number | undefined;
        srcIp?: string | undefined;
        dstIp?: string | undefined;
        interfaceIn?: string | undefined;
        interfaceOut?: string | undefined;
    };
}, {
    id: string;
    message: string;
    timestamp: Date;
    severity: "error" | "warning" | "info" | "critical" | "debug";
    topic: "firewall";
    parsed: {
        action: "accept" | "unknown" | "drop" | "reject";
        protocol: "unknown" | "TCP" | "UDP" | "ICMP" | "IPv6-ICMP" | "GRE" | "ESP" | "AH" | "IGMP";
        chain: "input" | "output" | "forward";
        length?: number | undefined;
        prefix?: string | undefined;
        srcPort?: number | undefined;
        dstPort?: number | undefined;
        srcIp?: string | undefined;
        dstIp?: string | undefined;
        interfaceIn?: string | undefined;
        interfaceOut?: string | undefined;
    };
}>;
/**
 * Validates an IP address (with optional CIDR) for firewall logs
 *
 * @param ip - IP address (with optional CIDR) to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidFirewallLogIP('192.168.1.1') // Returns true
 * isValidFirewallLogIP('10.0.0.0/8') // Returns true
 */
export declare function isValidFirewallLogIP(ip: string): boolean;
/**
 * Validates a port number for firewall logs
 *
 * @param port - Port number to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidFirewallLogPort(80) // Returns true
 * isValidFirewallLogPort(65536) // Returns false
 */
export declare function isValidFirewallLogPort(port: number): boolean;
/**
 * Gets a human-readable description for a firewall log action
 *
 * @param action - Inferred action from firewall log
 * @returns Description of the action
 *
 * @example
 * getFirewallLogActionDescription('drop') // Returns "Packet was silently discarded"
 */
export declare function getFirewallLogActionDescription(action: InferredAction): string;
/**
 * Gets a Tailwind color class for a firewall log action
 *
 * @param action - Inferred action from firewall log
 * @returns Tailwind CSS color classes
 *
 * @example
 * getFirewallLogActionColor('drop') // Returns "text-red-600 dark:text-red-400"
 */
export declare function getFirewallLogActionColor(action: InferredAction): string;
/**
 * Gets a human-readable description for a firewall log chain
 *
 * @param chain - Firewall chain (input/forward/output)
 * @returns Description of the chain
 *
 * @example
 * getFirewallLogChainDescription('forward') // Returns "Traffic through router"
 */
export declare function getFirewallLogChainDescription(chain: FirewallLogChain): string;
/**
 * Formats a firewall log connection as "srcIp:srcPort → dstIp:dstPort"
 * Returns 'unknown' for missing addresses
 *
 * @param parsed - Parsed firewall log data
 * @returns Formatted connection string
 *
 * @example
 * formatFirewallLogConnection(parsed) // Returns "192.168.1.100:54321 → 10.0.0.1:443"
 */
export declare function formatFirewallLogConnection(parsed: ParsedFirewallLog): string;
/**
 * Default firewall log entry for testing and mocking purposes
 * Represents a typical inbound packet drop on ether1 interface
 * Immutable constant for use in tests and component previews
 *
 * @example
 * const entry = DEFAULT_FIREWALL_LOG_ENTRY;
 * console.log(entry.parsed.chain); // 'input'
 * console.log(entry.parsed.action); // 'drop'
 */
export declare const DEFAULT_FIREWALL_LOG_ENTRY: Readonly<FirewallLogEntry>;
/**
 * Time range preset options for firewall log filtering
 * Provides predefined time ranges or custom option for user-specified ranges
 *
 * @example
 * const preset: TimeRangePreset = '1h'; // Last hour
 * const custom: TimeRangePreset = 'custom'; // User-specified range
 */
export type TimeRangePreset = '1h' | '6h' | '1d' | '1w' | 'custom';
/**
 * Time range value with start and end timestamps
 * Used for custom time range selection in firewall log filters
 */
export interface TimeRange {
    /** Start timestamp (inclusive) */
    readonly start: Date;
    /** End timestamp (inclusive) */
    readonly end: Date;
}
/**
 * Port range value (min-max inclusive)
 * Used for filtering by port range instead of specific port
 */
export interface PortRange {
    /** Minimum port number (inclusive) */
    readonly min: number;
    /** Maximum port number (inclusive) */
    readonly max: number;
}
/**
 * Complete filter state for firewall logs
 * Used by firewall log UI components and stores for filtering and querying log entries
 * All fields are optional for flexible filtering scenarios
 */
export interface FirewallLogFilterState {
    /**
     * Time range preset or custom selection
     */
    readonly timeRangePreset: TimeRangePreset;
    /**
     * Custom time range (only used when timeRangePreset is 'custom')
     */
    readonly timeRange?: TimeRange;
    /**
     * Selected actions to filter by (empty array means all actions)
     */
    readonly actions: readonly InferredAction[];
    /**
     * Source IP filter with wildcard support (e.g., 192.168.1.*)
     */
    readonly srcIp?: string;
    /**
     * Destination IP filter with wildcard support
     */
    readonly dstIp?: string;
    /**
     * Source port or port range filter
     */
    readonly srcPort?: number | PortRange;
    /**
     * Destination port or port range filter
     */
    readonly dstPort?: number | PortRange;
    /**
     * Log prefix filter (matches against prefix field in log entries)
     */
    readonly prefix?: string;
}
/**
 * Default filter state for firewall logs
 * Shows all logs from the last hour with no action filtering applied
 * Immutable constant for use as initial state in components and stores
 *
 * @example
 * const filter = DEFAULT_FIREWALL_LOG_FILTER_STATE;
 * console.log(filter.timeRangePreset); // '1h'
 * console.log(filter.actions.length); // 0
 */
export declare const DEFAULT_FIREWALL_LOG_FILTER_STATE: Readonly<FirewallLogFilterState>;
//# sourceMappingURL=firewall-log.types.d.ts.map