/**
 * Firewall Log Parsing Utilities
 *
 * Parses RouterOS firewall log messages into structured data.
 * Handles multiple log formats including logs with/without prefixes,
 * TCP/UDP/ICMP protocols, and extracts connection details.
 *
 * @see libs/core/types/src/firewall/firewall-log.types.ts
 */
import type { ParsedFirewallLog, InferredAction } from '@nasnet/core/types';
/**
 * Infers the firewall action from a log prefix
 *
 * @param prefix - The log prefix (e.g., "DROPPED-WAN", "ACCEPT", "BLOCKED")
 * @returns The inferred action
 *
 * @example
 * inferActionFromPrefix("DROPPED-WAN") // => "drop"
 * inferActionFromPrefix("ACCEPT") // => "accept"
 * inferActionFromPrefix("Custom-Log") // => "unknown"
 */
export declare function inferActionFromPrefix(prefix: string): InferredAction;
/**
 * Parses a RouterOS firewall log message into structured data
 *
 * Handles multiple log formats:
 * - Format 1 (No prefix): "forward: in:ether1 out:bridge1, proto TCP (SYN)..."
 * - Format 2 (With prefix): "DROPPED-WAN forward: in:ether1..."
 * - Format 3 (ICMP): "input: in:ether1 out:(unknown 0), proto ICMP (type 8, code 0)..."
 *
 * @param message - The raw log message from RouterOS
 * @returns Parsed firewall log data
 *
 * @example
 * parseFirewallLogMessage("forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443, len 52")
 * // => { chain: 'forward', action: 'unknown', protocol: 'TCP', srcIp: '192.168.1.100', ... }
 *
 * @example
 * parseFirewallLogMessage("DROPPED-WAN input: in:ether1, proto ICMP, 8.8.8.8->192.168.1.1")
 * // => { chain: 'input', action: 'drop', prefix: 'DROPPED-WAN', protocol: 'ICMP', ... }
 */
export declare function parseFirewallLogMessage(message: string): ParsedFirewallLog;
/**
 * Validates if a parsed log has minimum required fields
 *
 * @param parsed - The parsed log data
 * @returns true if valid, false otherwise
 */
export declare function isValidParsedLog(parsed: ParsedFirewallLog): boolean;
//# sourceMappingURL=parse-firewall-log.d.ts.map