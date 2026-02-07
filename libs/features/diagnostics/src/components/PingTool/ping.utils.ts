/**
 * Ping Utility Functions
 *
 * Validation and calculation utilities for the ping diagnostic tool.
 */

import { isValidIPv4 } from '@nasnet/core/utils';
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
export function isValidIPv6(value: string): boolean {
  if (!value || value.trim() === '') return false;

  // Remove brackets if present (e.g., [::1])
  const addr = value.replace(/^\[|\]$/g, '');

  // Check for IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (addr.includes('.')) {
    const lastColon = addr.lastIndexOf(':');
    if (lastColon === -1) return false;
    const ipv4Part = addr.slice(lastColon + 1);
    const ipv6Part = addr.slice(0, lastColon + 1);
    // Check if IPv4 part is valid and IPv6 part ends with :: or ::ffff:
    return isValidIPv4(ipv4Part) && /^::f{4}:$/i.test(ipv6Part);
  }

  // Split by :: for compressed notation
  const parts = addr.split('::');
  if (parts.length > 2) return false;

  // Get all segments
  const segments = parts.flatMap((part) => (part === '' ? [] : part.split(':')));

  // Validate segment count
  if (parts.length === 1 && segments.length !== 8) return false;
  if (parts.length === 2 && segments.length > 7) return false;

  // Validate each segment (1-4 hex chars)
  return segments.every((seg) => /^[0-9a-fA-F]{1,4}$/.test(seg));
}

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
export function isValidHostname(value: string): boolean {
  if (!value || value.length > 253) return false;

  const labels = value.split('.');

  return labels.every((label) => {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
    return /^[a-zA-Z0-9-]+$/.test(label);
  });
}

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
export function isValidPingTarget(value: string): boolean {
  return isValidIPv4(value) || isValidIPv6(value) || isValidHostname(value);
}

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
export function calculateStatistics(results: PingResult[]): PingStatistics {
  const sent = results.length;
  const successful = results.filter((r) => r.time !== null && !r.error);
  const received = successful.length;
  const lost = sent - received;
  const lossPercent = sent > 0 ? (lost / sent) * 100 : 0;

  const times = successful.map((r) => r.time!);

  // No successful pings - return null statistics
  if (times.length === 0) {
    return {
      sent,
      received,
      lost,
      lossPercent: Math.round(lossPercent * 10) / 10,
      minRtt: null,
      avgRtt: null,
      maxRtt: null,
      stdDev: null,
    };
  }

  // Calculate min, max, avg
  const minRtt = Math.min(...times);
  const maxRtt = Math.max(...times);
  const avgRtt = times.reduce((a, b) => a + b, 0) / times.length;

  // Calculate standard deviation
  const squareDiffs = times.map((t) => Math.pow(t - avgRtt, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return {
    sent,
    received,
    lost,
    lossPercent: Math.round(lossPercent * 10) / 10, // Round to 1 decimal
    minRtt: Math.round(minRtt * 100) / 100, // Round to 2 decimals
    avgRtt: Math.round(avgRtt * 100) / 100,
    maxRtt: Math.round(maxRtt * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}
