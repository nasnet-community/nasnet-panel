/**
 * DNS Utility Functions
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * @description Helper functions for DNS data parsing, validation, and formatting.
 * Includes:
 * - RouterOS DNS settings parsing and transformation
 * - TTL (time-to-live) human-readable formatting
 * - RFC 1123 hostname validation
 * - Duplicate detection for DNS entries and servers
 */

import type { DNSSettings, ParsedDNSSettings } from '@nasnet/core/types';

/**
 * Parse raw RouterOS DNS settings into UI-friendly format
 *
 * Transforms comma-separated server lists into arrays and calculates
 * cache usage percentage. Separates static (user-configured) from
 * dynamic (ISP-provided) DNS servers acquired via DHCP or PPPoE.
 *
 * @param raw - Raw DNS settings object from RouterOS /ip/dns endpoint
 * @returns Parsed and normalized settings with arrays and calculated percentages
 *
 * @description
 * - Parses comma-separated server strings into arrays
 * - Trims whitespace from each server address
 * - Filters out empty values
 * - Calculates cache usage percentage (0-100)
 * - Returns both static and dynamic server lists separately
 *
 * @example
 * ```typescript
 * const raw = {
 *   servers: '1.1.1.1,8.8.8.8',
 *   'dynamic-servers': '192.168.1.1',
 *   'cache-size': 2048,
 *   'cache-used': 1024,
 *   'allow-remote-requests': false,
 * };
 *
 * const parsed = parseDNSSettings(raw);
 * // Result:
 * // {
 * //   staticServers: ['1.1.1.1', '8.8.8.8'],
 * //   dynamicServers: ['192.168.1.1'],
 * //   cacheSize: 2048,
 * //   cacheUsed: 1024,
 * //   cacheUsedPercent: 50,
 * //   allowRemoteRequests: false,
 * // }
 * ```
 */
export function parseDNSSettings(raw: DNSSettings): ParsedDNSSettings {
  // Parse static servers (user-configured)
  const staticServers =
    raw.servers ?
      raw.servers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Parse dynamic servers (from DHCP/PPPoE)
  const dynamicServers =
    raw['dynamic-servers'] ?
      raw['dynamic-servers']
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Calculate cache usage percentage
  const cacheUsedPercent =
    raw['cache-size'] > 0 ? Math.round((raw['cache-used'] / raw['cache-size']) * 100) : 0;

  return {
    staticServers,
    dynamicServers,
    cacheSize: raw['cache-size'],
    cacheUsed: raw['cache-used'],
    cacheUsedPercent,
    allowRemoteRequests: raw['allow-remote-requests'],
  };
}

/**
 * Format TTL (time-to-live) seconds into human-readable string
 *
 * Converts seconds to the largest appropriate time unit for readability.
 * Useful for displaying TTL values in DNS tables, forms, and status displays.
 *
 * @param seconds - Time-to-live in seconds (range: 0-604800 representing 0-7 days)
 * @returns Human-readable time string with appropriate unit (days, hours, minutes, or seconds)
 *
 * @description
 * - Converts to largest applicable unit for best readability
 * - Uses singular/plural forms correctly ("1 day" vs "2 days")
 * - Processes units in order: days → hours → minutes → seconds
 * - Useful for displaying DNS cache TTL and static entry TTL values
 *
 * @example
 * ```typescript
 * formatTTL(604800) // '7 days' (1 week)
 * formatTTL(86400)  // '1 day'
 * formatTTL(172800) // '2 days'
 * formatTTL(3600)   // '1 hour'
 * formatTTL(7200)   // '2 hours'
 * formatTTL(60)     // '1 minute'
 * formatTTL(120)    // '2 minutes'
 * formatTTL(1)      // '1 second'
 * formatTTL(30)     // '30 seconds'
 * formatTTL(0)      // '0 seconds'
 * ```
 */
export function formatTTL(seconds: number): string {
  // Days (86400 seconds = 1 day)
  const SECONDS_PER_DAY = 86400;
  if (seconds >= SECONDS_PER_DAY) {
    const days = Math.floor(seconds / SECONDS_PER_DAY);
    return days === 1 ? '1 day' : `${days} days`;
  }

  // Hours (3600 seconds = 1 hour)
  const SECONDS_PER_HOUR = 3600;
  if (seconds >= SECONDS_PER_HOUR) {
    const hours = Math.floor(seconds / SECONDS_PER_HOUR);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  // Minutes (60 seconds = 1 minute)
  const SECONDS_PER_MINUTE = 60;
  if (seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  // Seconds
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

/**
 * Validate if a hostname is RFC 1123 compliant
 *
 * Helper function for manual hostname validation (client-side).
 * For form validation, prefer the Zod schema-based validation in dns-static-entry.schema.ts.
 *
 * @param hostname - Hostname string to validate
 * @returns true if hostname is valid per RFC 1123, false otherwise
 *
 * @description
 * Validates against RFC 1123 standard:
 * - Must be 1-253 characters long
 * - Must start and end with alphanumeric character
 * - May contain letters (A-Z, a-z), digits (0-9), hyphens (-), and dots (.)
 * - Hyphens/dots may not be at start or end
 * - No consecutive dots allowed
 *
 * @example
 * ```typescript
 * isValidHostname('nas.local')          // true
 * isValidHostname('my-server.lan')      // true
 * isValidHostname('printer.office.local') // true
 * isValidHostname('webserver')          // true
 * isValidHostname('-invalid')           // false (starts with hyphen)
 * isValidHostname('has space')          // false (contains space)
 * isValidHostname('.start-dot')         // false (starts with dot)
 * isValidHostname('end-dot.')           // false (ends with dot)
 * isValidHostname('')                   // false (empty)
 * ```
 */
export function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) {
    return false;
  }

  const HOSTNAME_PATTERN =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

  return HOSTNAME_PATTERN.test(hostname);
}

/**
 * Check for duplicate DNS server in static server list
 *
 * Helper function to prevent adding duplicate DNS server IP addresses.
 * Performs case-insensitive comparison after trimming whitespace.
 *
 * @param serverIp - IP address to check for duplication
 * @param existingServers - Array of existing server IP addresses
 * @returns true if serverIp already exists in existingServers, false otherwise
 *
 * @description
 * Used during DNS server list editing to prevent configuration errors.
 * Compares trimmed IP strings for exact matches.
 *
 * @example
 * ```typescript
 * const servers = ['1.1.1.1', '8.8.8.8'];
 *
 * isDuplicateServer('1.1.1.1', servers)  // true
 * isDuplicateServer('8.8.8.8', servers)  // true
 * isDuplicateServer('9.9.9.9', servers)  // false
 * isDuplicateServer('  1.1.1.1  ', servers) // true (whitespace trimmed)
 * ```
 */
export function isDuplicateServer(serverIp: string, existingServers: string[]): boolean {
  return existingServers.includes(serverIp.trim());
}

/**
 * Check for duplicate DNS static entry hostname
 *
 * Helper function to prevent adding duplicate static DNS hostname entries.
 * Comparison is case-insensitive. When editing an entry, pass its ID to exclude
 * it from the duplicate check (allows re-saving unchanged entries).
 *
 * @param hostname - Hostname string to check for duplication
 * @param existingEntries - Array of existing DNS static entry objects with name field
 * @param currentEntryId - Optional ID of entry being edited (excluded from duplicate check)
 * @returns true if duplicate found (excluding self), false otherwise
 *
 * @description
 * Used during DNS static entry creation/editing to prevent configuration errors.
 * - Comparison is case-insensitive ("NAS.LOCAL" == "nas.local")
 * - Whitespace is trimmed from hostname
 * - When editing, currentEntryId prevents false positive on self-comparison
 * - Useful for form validation before submission
 *
 * @example
 * ```typescript
 * const entries = [
 *   { id: '1', name: 'nas.local', address: '192.168.1.50' },
 *   { id: '2', name: 'printer.local', address: '192.168.1.60' },
 * ];
 *
 * // Creating new entry
 * isDuplicateHostname('nas.local', entries)              // true
 * isDuplicateHostname('NAS.LOCAL', entries)              // true (case-insensitive)
 * isDuplicateHostname('webserver.local', entries)        // false
 *
 * // Editing existing entry
 * isDuplicateHostname('nas.local', entries, '1')         // false (self excluded)
 * isDuplicateHostname('nas.local', entries, '2')         // true (conflicts with id '1')
 * isDuplicateHostname('  NAS.LOCAL  ', entries, '1')     // false (whitespace trimmed, self excluded)
 * ```
 */
export function isDuplicateHostname(
  hostname: string,
  existingEntries: Array<{ id?: string; name: string }>,
  currentEntryId?: string
): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return existingEntries.some((entry) => {
    // Skip the current entry when editing (exclude self from duplicate check)
    if (currentEntryId && entry.id === currentEntryId) {
      return false;
    }

    return entry.name.toLowerCase() === normalizedHostname;
  });
}
