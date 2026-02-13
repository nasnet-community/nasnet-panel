/**
 * Firewall Log Parsing Utilities
 *
 * Parses RouterOS firewall log messages into structured data.
 * Handles multiple log formats including logs with/without prefixes,
 * TCP/UDP/ICMP protocols, and extracts connection details.
 *
 * @see libs/core/types/src/firewall/firewall-log.types.ts
 */

import type {
  ParsedFirewallLog,
  FirewallLogChain,
  FirewallLogProtocol,
  InferredAction,
} from '@nasnet/core/types';

/**
 * Regex patterns for inferring firewall action from log prefix
 */
const ACTION_PATTERNS = {
  drop: /^(DROPPED?[-_]?|DROP[-_]?|BLOCKED?[-_]?|BLOCK[-_]?|DENY[-_]?)/i,
  reject: /^(REJECTED?[-_]?|REJECT[-_]?)/i,
  accept: /^(ACCEPTED?[-_]?|ACCEPT[-_]?|ALLOWED?[-_]?|ALLOW[-_]?|PERMIT[-_]?)/i,
} as const;

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
export function inferActionFromPrefix(prefix: string): InferredAction {
  if (ACTION_PATTERNS.drop.test(prefix)) return 'drop';
  if (ACTION_PATTERNS.reject.test(prefix)) return 'reject';
  if (ACTION_PATTERNS.accept.test(prefix)) return 'accept';
  return 'unknown';
}

/**
 * Extracts the chain from the log message
 *
 * @param message - The log message
 * @returns The chain (input/forward/output) or 'input' as fallback
 */
function extractChain(message: string): FirewallLogChain {
  const chainMatch = message.match(/\b(input|forward|output):/i);
  if (chainMatch) {
    return chainMatch[1].toLowerCase() as FirewallLogChain;
  }
  return 'input'; // Default fallback
}

/**
 * Extracts the prefix from the log message (if any)
 *
 * @param message - The log message
 * @returns The prefix or undefined
 *
 * @example
 * extractPrefix("DROPPED-WAN forward: in:ether1...") // => "DROPPED-WAN"
 * extractPrefix("forward: in:ether1...") // => undefined
 */
function extractPrefix(message: string): string | undefined {
  // Prefix is everything before the chain keyword
  const prefixMatch = message.match(/^([A-Z][A-Z0-9_-]*)\s+(input|forward|output):/i);
  if (prefixMatch) {
    return prefixMatch[1];
  }
  return undefined;
}

/**
 * Extracts input interface from log message
 *
 * @param message - The log message
 * @returns The input interface or undefined
 */
function extractInterfaceIn(message: string): string | undefined {
  const match = message.match(/in:([a-zA-Z0-9_-]+)/);
  return match?.[1];
}

/**
 * Extracts output interface from log message
 *
 * @param message - The log message
 * @returns The output interface or undefined
 */
function extractInterfaceOut(message: string): string | undefined {
  const match = message.match(/out:([a-zA-Z0-9_-]+)/);
  // Filter out "(unknown 0)" placeholder
  if (match && match[1] !== '(unknown') {
    return match[1];
  }
  return undefined;
}

/**
 * Extracts protocol from log message
 *
 * @param message - The log message
 * @returns The protocol
 */
function extractProtocol(message: string): FirewallLogProtocol {
  const protoMatch = message.match(/proto\s+([A-Z0-9-]+)/i);
  if (protoMatch) {
    const proto = protoMatch[1];
    // Normalize protocol names (case-sensitive for IPv6-ICMP)
    const normalized = proto.toLowerCase();

    if (normalized === 'tcp') return 'TCP';
    if (normalized === 'udp') return 'UDP';
    if (normalized === 'icmp') return 'ICMP';
    if (normalized === 'ipv6-icmp') return 'IPv6-ICMP';
    if (normalized === 'gre') return 'GRE';
    if (normalized === 'esp') return 'ESP';
    if (normalized === 'ah') return 'AH';
    if (normalized === 'igmp') return 'IGMP';
  }
  return 'unknown';
}

/**
 * Extracts source and destination IPs and ports from log message
 *
 * @param message - The log message
 * @param protocol - The protocol (needed to know if ports are expected)
 * @returns Object with srcIp, srcPort, dstIp, dstPort
 */
function extractConnection(
  message: string,
  protocol: FirewallLogProtocol
): {
  srcIp?: string;
  srcPort?: number;
  dstIp?: string;
  dstPort?: number;
} {
  // TCP/UDP format: "192.168.1.100:54321->10.0.0.1:443"
  // ICMP format: "192.168.1.100->10.0.0.1"
  const hasPorts = protocol === 'TCP' || protocol === 'UDP';

  if (hasPorts) {
    // Match: IP:PORT->IP:PORT
    const connMatch = message.match(
      /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})->(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/
    );
    if (connMatch) {
      return {
        srcIp: connMatch[1],
        srcPort: parseInt(connMatch[2], 10),
        dstIp: connMatch[3],
        dstPort: parseInt(connMatch[4], 10),
      };
    }
  }

  // Try without ports: IP->IP
  const ipOnlyMatch = message.match(
    /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})->(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
  );
  if (ipOnlyMatch) {
    return {
      srcIp: ipOnlyMatch[1],
      dstIp: ipOnlyMatch[2],
    };
  }

  return {};
}

/**
 * Extracts packet length from log message
 *
 * @param message - The log message
 * @returns The packet length or undefined
 */
function extractLength(message: string): number | undefined {
  const lenMatch = message.match(/len[:\s]+(\d+)/i);
  if (lenMatch) {
    const len = parseInt(lenMatch[1], 10);
    return !isNaN(len) ? len : undefined;
  }
  return undefined;
}

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
export function parseFirewallLogMessage(message: string): ParsedFirewallLog {
  try {
    // Extract basic fields
    const prefix = extractPrefix(message);
    const chain = extractChain(message);
    const protocol = extractProtocol(message);
    const interfaceIn = extractInterfaceIn(message);
    const interfaceOut = extractInterfaceOut(message);
    const length = extractLength(message);

    // Infer action from prefix
    const action = prefix ? inferActionFromPrefix(prefix) : 'unknown';

    // Extract connection details
    const connection = extractConnection(message, protocol);

    return {
      chain,
      action,
      protocol,
      prefix,
      interfaceIn,
      interfaceOut,
      length,
      ...connection,
    };
  } catch (error) {
    // Graceful fallback on parsing errors
    return {
      chain: 'input',
      action: 'unknown',
      protocol: 'unknown',
    };
  }
}

/**
 * Validates if a parsed log has minimum required fields
 *
 * @param parsed - The parsed log data
 * @returns true if valid, false otherwise
 */
export function isValidParsedLog(parsed: ParsedFirewallLog): boolean {
  return (
    parsed.chain !== undefined &&
    parsed.action !== undefined &&
    parsed.protocol !== undefined
  );
}
