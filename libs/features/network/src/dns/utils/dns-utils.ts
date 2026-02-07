/**
 * DNS Utility Functions
 *
 * Helper functions for DNS data parsing and formatting.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import type { DNSSettings, ParsedDNSSettings } from '@nasnet/core/types';

/**
 * Parse raw RouterOS DNS settings into UI-friendly format
 *
 * Transforms comma-separated server lists into arrays and calculates
 * cache usage percentage. Separates static (user-configured) from
 * dynamic (ISP-provided) DNS servers.
 *
 * @param raw - Raw DNS settings from RouterOS /ip/dns endpoint
 * @returns Parsed settings with separated server lists and calculated percentages
 *
 * @example
 * ```typescript
 * const raw = {
 *   servers: '1.1.1.1,8.8.8.8',
 *   'dynamic-servers': '192.168.1.1',
 *   'cache-size': 2048,
 *   'cache-used': 1024,
 *   'allow-remote-requests': false,
 *   // ... other fields
 * };
 *
 * const parsed = parseDNSSettings(raw);
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
  const staticServers = raw.servers
    ? raw.servers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Parse dynamic servers (from DHCP/PPPoE)
  const dynamicServers = raw['dynamic-servers']
    ? raw['dynamic-servers']
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Calculate cache usage percentage
  const cacheUsedPercent =
    raw['cache-size'] > 0
      ? Math.round((raw['cache-used'] / raw['cache-size']) * 100)
      : 0;

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
 * Useful for displaying TTL values in tables and forms.
 *
 * @param seconds - Time-to-live in seconds (0-604800)
 * @returns Human-readable time string
 *
 * @example
 * ```typescript
 * formatTTL(86400)  // '1 day'
 * formatTTL(172800) // '2 days'
 * formatTTL(3600)   // '1 hour'
 * formatTTL(7200)   // '2 hours'
 * formatTTL(60)     // '1 minute'
 * formatTTL(120)    // '2 minutes'
 * formatTTL(1)      // '1 second'
 * formatTTL(30)     // '30 seconds'
 * ```
 */
export function formatTTL(seconds: number): string {
  // Days (86400 seconds = 1 day)
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return days === 1 ? '1 day' : `${days} days`;
  }

  // Hours (3600 seconds = 1 hour)
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  // Minutes (60 seconds = 1 minute)
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  // Seconds
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

/**
 * Validate if a hostname is RFC 1123 compliant
 *
 * Helper function for manual hostname validation.
 * Note: Zod schema validation is preferred in forms.
 *
 * @param hostname - Hostname to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidHostname('nas.local')        // true
 * isValidHostname('my-server.lan')    // true
 * isValidHostname('-invalid')         // false
 * isValidHostname('has space')        // false
 * ```
 */
export function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) {
    return false;
  }

  const hostnamePattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

  return hostnamePattern.test(hostname);
}

/**
 * Check for duplicate DNS server in list
 *
 * Helper function to prevent adding duplicate static DNS servers.
 *
 * @param serverIp - IP address to check
 * @param existingServers - Array of existing server IPs
 * @returns true if duplicate found, false otherwise
 *
 * @example
 * ```typescript
 * const servers = ['1.1.1.1', '8.8.8.8'];
 * isDuplicateServer('1.1.1.1', servers)  // true
 * isDuplicateServer('9.9.9.9', servers)  // false
 * ```
 */
export function isDuplicateServer(
  serverIp: string,
  existingServers: string[]
): boolean {
  return existingServers.includes(serverIp.trim());
}

/**
 * Check for duplicate DNS static entry hostname
 *
 * Helper function to prevent adding duplicate static DNS entries.
 * When editing, pass the current entry ID to exclude it from the check.
 *
 * @param hostname - Hostname to check
 * @param existingEntries - Array of existing entries with name field
 * @param currentEntryId - Optional ID of entry being edited (to exclude from check)
 * @returns true if duplicate found, false otherwise
 *
 * @example
 * ```typescript
 * const entries = [
 *   { id: '1', name: 'nas.local', address: '192.168.1.50' },
 *   { id: '2', name: 'printer.local', address: '192.168.1.60' },
 * ];
 *
 * isDuplicateHostname('nas.local', entries)              // true
 * isDuplicateHostname('nas.local', entries, '1')         // false (editing itself)
 * isDuplicateHostname('webserver.local', entries)        // false
 * ```
 */
export function isDuplicateHostname(
  hostname: string,
  existingEntries: Array<{ id?: string; name: string }>,
  currentEntryId?: string
): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return existingEntries.some((entry) => {
    // Skip the current entry when editing
    if (currentEntryId && entry.id === currentEntryId) {
      return false;
    }

    return entry.name.toLowerCase() === normalizedHostname;
  });
}
