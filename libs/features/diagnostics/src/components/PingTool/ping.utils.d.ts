/**
 * Ping Utility Functions
 *
 * Validation and calculation utilities for the ping diagnostic tool.
 */
import type { PingResult, PingStatistics } from './PingTool.types';
/**
 * Validates if a string is a valid IPv6 address.
 * Supports standard and compressed notation, with or without brackets.
 *
 * @param value - The string to validate
 * @returns True if valid IPv6 address, false otherwise
 *
 * @example
 * isValidIPv6('2001:4860:4860::8888') // true
 * isValidIPv6('::1') // true
 * isValidIPv6('[::1]') // true
 * isValidIPv6('192.168.1.1') // false
 */
export declare function isValidIPv6(value: string): boolean;
/**
 * Validates if a string is a valid hostname according to RFC 1123.
 *
 * Rules:
 * - Total length ≤ 253 characters
 * - Each label ≤ 63 characters
 * - Labels can contain alphanumeric characters and hyphens
 * - Labels cannot start or end with a hyphen
 *
 * @param value - The string to validate
 * @returns True if valid hostname, false otherwise
 *
 * @example
 * isValidHostname('example.com') // true
 * isValidHostname('localhost') // true
 * isValidHostname('-invalid.com') // false
 */
export declare function isValidHostname(value: string): boolean;
/**
 * Validates if a string is a valid ping target (IPv4, IPv6, or hostname).
 *
 * @param value - The string to validate
 * @returns True if valid target, false otherwise
 *
 * @example
 * isValidPingTarget('8.8.8.8') // true
 * isValidPingTarget('2001:4860:4860::8888') // true
 * isValidPingTarget('google.com') // true
 * isValidPingTarget('not valid') // false
 */
export declare function isValidPingTarget(value: string): boolean;
/**
 * Calculates ping statistics from an array of results.
 *
 * Computes:
 * - Packets sent, received, lost, and loss percentage
 * - Min/avg/max round-trip time (RTT)
 * - Standard deviation of RTT
 *
 * @param results - Array of ping results
 * @returns Calculated statistics
 *
 * @example
 * const results = [
 *   { seq: 1, time: 12.5, error: null, ... },
 *   { seq: 2, time: null, error: 'timeout', ... },
 * ];
 * const stats = calculateStatistics(results);
 * // { sent: 2, received: 1, lost: 1, lossPercent: 50, ... }
 */
export declare function calculateStatistics(results: PingResult[]): PingStatistics;
//# sourceMappingURL=ping.utils.d.ts.map