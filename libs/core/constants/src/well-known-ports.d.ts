/**
 * Well-Known Ports Database
 *
 * Static database of well-known TCP/UDP ports for service name lookup.
 * Used by the PortInput component for displaying service names and suggestions.
 *
 * Based on IANA Service Name and Transport Protocol Port Number Registry.
 * @see https://www.iana.org/assignments/service-names-port-numbers
 *
 * @module @nasnet/core/constants/well-known-ports
 */
/**
 * Protocol type for port services.
 */
export type PortProtocol = 'tcp' | 'udp' | 'both';
/**
 * Category for grouping ports in suggestions.
 */
export type PortCategory = 'web' | 'secure' | 'database' | 'messaging' | 'mail' | 'network' | 'system' | 'containers' | 'mikrotik';
/**
 * Well-known port entry with service information.
 */
export interface WellKnownPort {
    /** Port number */
    port: number;
    /** Service name (e.g., "HTTP", "SSH") */
    service: string;
    /** Protocol (TCP, UDP, or both) */
    protocol: PortProtocol;
    /** Category for grouping */
    category: PortCategory;
    /** Optional description */
    description?: string;
    /** Built-in flag (true = read-only, false = user-editable) */
    builtIn: boolean;
}
/**
 * Comprehensive list of well-known ports (~100 most common).
 */
export declare const WELL_KNOWN_PORTS: WellKnownPort[];
/**
 * Look up service name by port number.
 *
 * @param port - Port number to look up
 * @param protocol - Optional protocol filter ('tcp', 'udp', or 'both')
 * @returns Service name or null if not found
 *
 * @example
 * getServiceByPort(80); // 'HTTP'
 * getServiceByPort(443, 'tcp'); // 'HTTPS'
 * getServiceByPort(12345); // null
 */
export declare function getServiceByPort(port: number, protocol?: PortProtocol): string | null;
/**
 * Get full port entry by port number.
 *
 * @param port - Port number to look up
 * @param protocol - Optional protocol filter
 * @returns WellKnownPort entry or null if not found
 */
export declare function getPortEntry(port: number, protocol?: PortProtocol): WellKnownPort | null;
/**
 * Get all ports in a specific category.
 *
 * @param category - Category to filter by
 * @returns Array of WellKnownPort entries in that category
 *
 * @example
 * getPortsByCategory('web'); // Returns HTTP, HTTPS, etc.
 * getPortsByCategory('mikrotik'); // Returns Winbox, RouterOS-API, etc.
 */
export declare function getPortsByCategory(category: PortCategory): WellKnownPort[];
/**
 * Search ports by service name or port number.
 * Useful for autocomplete functionality.
 *
 * @param query - Search query (service name or port number)
 * @param limit - Maximum results to return (default: 10)
 * @returns Array of matching WellKnownPort entries
 *
 * @example
 * searchPorts('http'); // Returns HTTP, HTTPS, HTTP-Alt, etc.
 * searchPorts('22'); // Returns SSH
 * searchPorts('sql'); // Returns MySQL, MSSQL, PostgreSQL
 */
export declare function searchPorts(query: string, limit?: number): WellKnownPort[];
/**
 * Get suggested ports grouped by category for dropdown display.
 *
 * @param categories - Categories to include (default: web, secure, database)
 * @returns Object with category names as keys and port arrays as values
 *
 * @example
 * getSuggestionsByCategory(['web', 'secure']);
 * // Returns { web: [...], secure: [...] }
 */
export declare function getSuggestionsByCategory(categories?: PortCategory[]): Record<PortCategory, WellKnownPort[]>;
/**
 * Category display names for UI rendering.
 *
 * Maps each port category to its human-readable label used in dropdowns
 * and filter options.
 *
 * @example
 * const label = PORT_CATEGORY_LABELS['web']; // 'Web Services'
 */
export declare const PORT_CATEGORY_LABELS: Record<PortCategory, string>;
/**
 * Pre-configured port presets for common use cases.
 *
 * Provides grouped ports for typical server configurations,
 * enabling quick selection in forms without manual input.
 *
 * @example
 * const ports = PORT_PRESETS.webServer; // [80, 443]
 * const allPorts = PORT_PRESETS.vpnPorts; // [1194, 51820, 500, 4500, 1701, 1723]
 */
export declare const PORT_PRESETS: {
    readonly webServer: readonly [80, 443];
    readonly mailServer: readonly [25, 465, 587, 993, 995];
    readonly sshAccess: readonly [22];
    readonly mikrotikManagement: readonly [8291, 8728, 8729];
    readonly databaseCommon: readonly [3306, 5432, 27017, 6379];
    readonly vpnPorts: readonly [1194, 51820, 500, 4500, 1701, 1723];
};
//# sourceMappingURL=well-known-ports.d.ts.map