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
export type PortCategory =
  | 'web'
  | 'secure'
  | 'database'
  | 'messaging'
  | 'mail'
  | 'network'
  | 'system'
  | 'containers'
  | 'mikrotik';

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
}

/**
 * Comprehensive list of well-known ports (~100 most common).
 */
export const WELL_KNOWN_PORTS: WellKnownPort[] = [
  // ============================================================================
  // Web Services (15)
  // ============================================================================
  { port: 80, service: 'HTTP', protocol: 'tcp', category: 'web', description: 'Hypertext Transfer Protocol' },
  { port: 443, service: 'HTTPS', protocol: 'tcp', category: 'web', description: 'HTTP over TLS/SSL' },
  { port: 8080, service: 'HTTP-Alt', protocol: 'tcp', category: 'web', description: 'Alternative HTTP port' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'tcp', category: 'web', description: 'Alternative HTTPS port' },
  { port: 3000, service: 'Dev Server', protocol: 'tcp', category: 'web', description: 'Common development server' },
  { port: 4000, service: 'Dev Server', protocol: 'tcp', category: 'web', description: 'Alternative dev server' },
  { port: 5000, service: 'Dev Server', protocol: 'tcp', category: 'web', description: 'Flask/Python dev server' },
  { port: 8000, service: 'HTTP-Alt', protocol: 'tcp', category: 'web', description: 'Alternative HTTP port' },
  { port: 8888, service: 'HTTP-Alt', protocol: 'tcp', category: 'web', description: 'Alternative HTTP port' },
  { port: 9000, service: 'HTTP-Alt', protocol: 'tcp', category: 'web', description: 'PHP-FPM / SonarQube' },
  { port: 9090, service: 'HTTP-Alt', protocol: 'tcp', category: 'web', description: 'Prometheus / Cockpit' },
  { port: 9443, service: 'HTTPS-Alt', protocol: 'tcp', category: 'web', description: 'Alternative HTTPS port' },
  { port: 3001, service: 'Dev Server', protocol: 'tcp', category: 'web', description: 'Alternative dev server' },
  { port: 4200, service: 'Angular', protocol: 'tcp', category: 'web', description: 'Angular dev server' },
  { port: 5173, service: 'Vite', protocol: 'tcp', category: 'web', description: 'Vite dev server' },

  // ============================================================================
  // Secure Access (12)
  // ============================================================================
  { port: 22, service: 'SSH', protocol: 'tcp', category: 'secure', description: 'Secure Shell' },
  { port: 23, service: 'Telnet', protocol: 'tcp', category: 'secure', description: 'Telnet (unencrypted)' },
  { port: 3389, service: 'RDP', protocol: 'tcp', category: 'secure', description: 'Remote Desktop Protocol' },
  { port: 5900, service: 'VNC', protocol: 'tcp', category: 'secure', description: 'Virtual Network Computing' },
  { port: 5901, service: 'VNC-1', protocol: 'tcp', category: 'secure', description: 'VNC Display 1' },
  { port: 2222, service: 'SSH-Alt', protocol: 'tcp', category: 'secure', description: 'Alternative SSH port' },
  { port: 8022, service: 'SSH-Alt', protocol: 'tcp', category: 'secure', description: 'Alternative SSH port' },
  { port: 10022, service: 'SSH-Alt', protocol: 'tcp', category: 'secure', description: 'Alternative SSH port' },
  { port: 6000, service: 'X11', protocol: 'tcp', category: 'secure', description: 'X Window System' },
  { port: 5800, service: 'VNC-HTTP', protocol: 'tcp', category: 'secure', description: 'VNC over HTTP' },
  { port: 21, service: 'FTP', protocol: 'tcp', category: 'secure', description: 'File Transfer Protocol' },
  { port: 20, service: 'FTP-Data', protocol: 'tcp', category: 'secure', description: 'FTP Data Transfer' },

  // ============================================================================
  // Database (16)
  // ============================================================================
  { port: 3306, service: 'MySQL', protocol: 'tcp', category: 'database', description: 'MySQL/MariaDB' },
  { port: 5432, service: 'PostgreSQL', protocol: 'tcp', category: 'database', description: 'PostgreSQL' },
  { port: 27017, service: 'MongoDB', protocol: 'tcp', category: 'database', description: 'MongoDB' },
  { port: 6379, service: 'Redis', protocol: 'tcp', category: 'database', description: 'Redis' },
  { port: 9200, service: 'Elasticsearch', protocol: 'tcp', category: 'database', description: 'Elasticsearch HTTP' },
  { port: 9300, service: 'ES-Transport', protocol: 'tcp', category: 'database', description: 'Elasticsearch Transport' },
  { port: 5984, service: 'CouchDB', protocol: 'tcp', category: 'database', description: 'Apache CouchDB' },
  { port: 7474, service: 'Neo4j', protocol: 'tcp', category: 'database', description: 'Neo4j HTTP' },
  { port: 8086, service: 'InfluxDB', protocol: 'tcp', category: 'database', description: 'InfluxDB HTTP' },
  { port: 9042, service: 'Cassandra', protocol: 'tcp', category: 'database', description: 'Apache Cassandra' },
  { port: 1433, service: 'MSSQL', protocol: 'tcp', category: 'database', description: 'Microsoft SQL Server' },
  { port: 1521, service: 'Oracle', protocol: 'tcp', category: 'database', description: 'Oracle Database' },
  { port: 50000, service: 'DB2', protocol: 'tcp', category: 'database', description: 'IBM DB2' },
  { port: 26257, service: 'CockroachDB', protocol: 'tcp', category: 'database', description: 'CockroachDB' },
  { port: 28015, service: 'RethinkDB', protocol: 'tcp', category: 'database', description: 'RethinkDB' },
  { port: 7687, service: 'Neo4j-Bolt', protocol: 'tcp', category: 'database', description: 'Neo4j Bolt' },

  // ============================================================================
  // Mail (10)
  // ============================================================================
  { port: 25, service: 'SMTP', protocol: 'tcp', category: 'mail', description: 'Simple Mail Transfer Protocol' },
  { port: 110, service: 'POP3', protocol: 'tcp', category: 'mail', description: 'Post Office Protocol v3' },
  { port: 143, service: 'IMAP', protocol: 'tcp', category: 'mail', description: 'Internet Message Access Protocol' },
  { port: 465, service: 'SMTPS', protocol: 'tcp', category: 'mail', description: 'SMTP over TLS' },
  { port: 587, service: 'Submission', protocol: 'tcp', category: 'mail', description: 'Mail Submission' },
  { port: 993, service: 'IMAPS', protocol: 'tcp', category: 'mail', description: 'IMAP over TLS' },
  { port: 995, service: 'POP3S', protocol: 'tcp', category: 'mail', description: 'POP3 over TLS' },
  { port: 2525, service: 'SMTP-Alt', protocol: 'tcp', category: 'mail', description: 'Alternative SMTP' },
  { port: 1025, service: 'Mailcatcher', protocol: 'tcp', category: 'mail', description: 'Development mail server' },
  { port: 3025, service: 'SMTP-Dev', protocol: 'tcp', category: 'mail', description: 'Development SMTP' },

  // ============================================================================
  // Messaging (11)
  // ============================================================================
  { port: 5672, service: 'AMQP', protocol: 'tcp', category: 'messaging', description: 'RabbitMQ AMQP' },
  { port: 15672, service: 'RabbitMQ', protocol: 'tcp', category: 'messaging', description: 'RabbitMQ Management' },
  { port: 1883, service: 'MQTT', protocol: 'tcp', category: 'messaging', description: 'MQTT Protocol' },
  { port: 8883, service: 'MQTTS', protocol: 'tcp', category: 'messaging', description: 'MQTT over TLS' },
  { port: 9092, service: 'Kafka', protocol: 'tcp', category: 'messaging', description: 'Apache Kafka' },
  { port: 5222, service: 'XMPP', protocol: 'tcp', category: 'messaging', description: 'XMPP Client' },
  { port: 5269, service: 'XMPP-S2S', protocol: 'tcp', category: 'messaging', description: 'XMPP Server-to-Server' },
  { port: 11211, service: 'Memcached', protocol: 'tcp', category: 'messaging', description: 'Memcached' },
  { port: 4222, service: 'NATS', protocol: 'tcp', category: 'messaging', description: 'NATS Messaging' },
  { port: 6667, service: 'IRC', protocol: 'tcp', category: 'messaging', description: 'Internet Relay Chat' },
  { port: 6697, service: 'IRC-TLS', protocol: 'tcp', category: 'messaging', description: 'IRC over TLS' },

  // ============================================================================
  // Network/VPN (20)
  // ============================================================================
  { port: 53, service: 'DNS', protocol: 'both', category: 'network', description: 'Domain Name System' },
  { port: 67, service: 'DHCP-S', protocol: 'udp', category: 'network', description: 'DHCP Server' },
  { port: 68, service: 'DHCP-C', protocol: 'udp', category: 'network', description: 'DHCP Client' },
  { port: 69, service: 'TFTP', protocol: 'udp', category: 'network', description: 'Trivial File Transfer' },
  { port: 123, service: 'NTP', protocol: 'udp', category: 'network', description: 'Network Time Protocol' },
  { port: 161, service: 'SNMP', protocol: 'udp', category: 'network', description: 'SNMP' },
  { port: 162, service: 'SNMP-Trap', protocol: 'udp', category: 'network', description: 'SNMP Trap' },
  { port: 500, service: 'IKE', protocol: 'udp', category: 'network', description: 'IKE (IPsec)' },
  { port: 1194, service: 'OpenVPN', protocol: 'udp', category: 'network', description: 'OpenVPN' },
  { port: 51820, service: 'WireGuard', protocol: 'udp', category: 'network', description: 'WireGuard VPN' },
  { port: 4500, service: 'IPsec-NAT', protocol: 'udp', category: 'network', description: 'IPsec NAT Traversal' },
  { port: 1701, service: 'L2TP', protocol: 'udp', category: 'network', description: 'L2TP' },
  { port: 1723, service: 'PPTP', protocol: 'tcp', category: 'network', description: 'PPTP VPN' },
  { port: 1812, service: 'RADIUS', protocol: 'udp', category: 'network', description: 'RADIUS Authentication' },
  { port: 1813, service: 'RADIUS-Acct', protocol: 'udp', category: 'network', description: 'RADIUS Accounting' },
  { port: 179, service: 'BGP', protocol: 'tcp', category: 'network', description: 'Border Gateway Protocol' },
  { port: 514, service: 'Syslog', protocol: 'udp', category: 'network', description: 'Syslog' },
  { port: 6514, service: 'Syslog-TLS', protocol: 'tcp', category: 'network', description: 'Syslog over TLS' },
  { port: 47, service: 'GRE', protocol: 'tcp', category: 'network', description: 'GRE Protocol' },
  { port: 1080, service: 'SOCKS', protocol: 'tcp', category: 'network', description: 'SOCKS Proxy' },

  // ============================================================================
  // Containers/DevOps (10)
  // ============================================================================
  { port: 2375, service: 'Docker', protocol: 'tcp', category: 'containers', description: 'Docker daemon' },
  { port: 2376, service: 'Docker-TLS', protocol: 'tcp', category: 'containers', description: 'Docker daemon TLS' },
  { port: 8500, service: 'Consul', protocol: 'tcp', category: 'containers', description: 'HashiCorp Consul' },
  { port: 8300, service: 'Consul-RPC', protocol: 'tcp', category: 'containers', description: 'Consul RPC' },
  { port: 10250, service: 'Kubelet', protocol: 'tcp', category: 'containers', description: 'Kubernetes Kubelet' },
  { port: 6443, service: 'K8s-API', protocol: 'tcp', category: 'containers', description: 'Kubernetes API' },
  { port: 30000, service: 'K8s-NodePort', protocol: 'tcp', category: 'containers', description: 'K8s NodePort start' },
  { port: 32767, service: 'K8s-NodePort', protocol: 'tcp', category: 'containers', description: 'K8s NodePort end' },
  { port: 4243, service: 'Docker-Alt', protocol: 'tcp', category: 'containers', description: 'Alternative Docker' },
  { port: 2380, service: 'etcd', protocol: 'tcp', category: 'containers', description: 'etcd peer' },

  // ============================================================================
  // MikroTik/RouterOS Specific (5)
  // ============================================================================
  { port: 8291, service: 'Winbox', protocol: 'tcp', category: 'mikrotik', description: 'MikroTik Winbox' },
  { port: 8728, service: 'RouterOS-API', protocol: 'tcp', category: 'mikrotik', description: 'RouterOS API' },
  { port: 8729, service: 'RouterOS-API-SSL', protocol: 'tcp', category: 'mikrotik', description: 'RouterOS API over TLS' },
  { port: 2000, service: 'Bandwidth-Test', protocol: 'tcp', category: 'mikrotik', description: 'MikroTik Bandwidth Test' },
  { port: 20561, service: 'MAC-Winbox', protocol: 'udp', category: 'mikrotik', description: 'MikroTik MAC Winbox' },
];

/**
 * Pre-built lookup map for O(1) service lookups by port number.
 * Organized by port -> protocol -> service for protocol-aware lookups.
 */
const portLookupMap = new Map<number, Map<PortProtocol, WellKnownPort>>();

// Build the lookup map
WELL_KNOWN_PORTS.forEach((entry) => {
  if (!portLookupMap.has(entry.port)) {
    portLookupMap.set(entry.port, new Map());
  }
  const protocolMap = portLookupMap.get(entry.port)!;
  protocolMap.set(entry.protocol, entry);
  // For 'both' protocol, also add to tcp and udp lookups
  if (entry.protocol === 'both') {
    protocolMap.set('tcp', entry);
    protocolMap.set('udp', entry);
  }
});

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
export function getServiceByPort(
  port: number,
  protocol?: PortProtocol
): string | null {
  const protocolMap = portLookupMap.get(port);
  if (!protocolMap) return null;

  // If protocol specified, try exact match first
  if (protocol) {
    const entry = protocolMap.get(protocol);
    if (entry) return entry.service;
    // Fall back to 'both' if available
    const bothEntry = protocolMap.get('both');
    if (bothEntry) return bothEntry.service;
    return null;
  }

  // No protocol specified - return first match (prefer tcp > udp > both)
  return (
    protocolMap.get('tcp')?.service ||
    protocolMap.get('udp')?.service ||
    protocolMap.get('both')?.service ||
    null
  );
}

/**
 * Get full port entry by port number.
 *
 * @param port - Port number to look up
 * @param protocol - Optional protocol filter
 * @returns WellKnownPort entry or null if not found
 */
export function getPortEntry(
  port: number,
  protocol?: PortProtocol
): WellKnownPort | null {
  const protocolMap = portLookupMap.get(port);
  if (!protocolMap) return null;

  if (protocol) {
    return protocolMap.get(protocol) || protocolMap.get('both') || null;
  }

  return (
    protocolMap.get('tcp') ||
    protocolMap.get('udp') ||
    protocolMap.get('both') ||
    null
  );
}

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
export function getPortsByCategory(category: PortCategory): WellKnownPort[] {
  return WELL_KNOWN_PORTS.filter((entry) => entry.category === category);
}

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
export function searchPorts(query: string, limit = 10): WellKnownPort[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Check if query is a port number
  const portNum = parseInt(normalizedQuery, 10);
  if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
    const exactMatch = WELL_KNOWN_PORTS.filter((p) => p.port === portNum);
    const startsWith = WELL_KNOWN_PORTS.filter(
      (p) => p.port !== portNum && p.port.toString().startsWith(normalizedQuery)
    );
    return [...exactMatch, ...startsWith].slice(0, limit);
  }

  // Search by service name
  const exactMatches: WellKnownPort[] = [];
  const startsWithMatches: WellKnownPort[] = [];
  const containsMatches: WellKnownPort[] = [];

  WELL_KNOWN_PORTS.forEach((entry) => {
    const serviceLower = entry.service.toLowerCase();
    const descLower = entry.description?.toLowerCase() || '';

    if (serviceLower === normalizedQuery) {
      exactMatches.push(entry);
    } else if (serviceLower.startsWith(normalizedQuery)) {
      startsWithMatches.push(entry);
    } else if (
      serviceLower.includes(normalizedQuery) ||
      descLower.includes(normalizedQuery)
    ) {
      containsMatches.push(entry);
    }
  });

  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(
    0,
    limit
  );
}

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
export function getSuggestionsByCategory(
  categories: PortCategory[] = ['web', 'secure', 'database', 'mikrotik']
): Record<PortCategory, WellKnownPort[]> {
  const result = {} as Record<PortCategory, WellKnownPort[]>;

  categories.forEach((category) => {
    result[category] = getPortsByCategory(category).slice(0, 5);
  });

  return result;
}

/**
 * Category display names for UI.
 */
export const PORT_CATEGORY_LABELS: Record<PortCategory, string> = {
  web: 'Web Services',
  secure: 'Secure Access',
  database: 'Database',
  messaging: 'Messaging',
  mail: 'Email',
  network: 'Network/VPN',
  system: 'System',
  containers: 'Containers',
  mikrotik: 'MikroTik',
};

/**
 * Common port presets for quick selection.
 */
export const PORT_PRESETS = {
  webServer: [80, 443],
  mailServer: [25, 465, 587, 993, 995],
  sshAccess: [22],
  mikrotikManagement: [8291, 8728, 8729],
  databaseCommon: [3306, 5432, 27017, 6379],
  vpnPorts: [1194, 51820, 500, 4500, 1701, 1723],
} as const;

export default WELL_KNOWN_PORTS;
