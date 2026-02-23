/**
 * Firewall configuration types
 * Handles filter rules, NAT rules, mangle rules, and routing
 *
 * @module @nasnet/core/types/router/firewall
 */

/**
 * Firewall chain types for packet filtering
 *
 * @remarks
 * RouterOS firewall chains where rules can be applied:
 * - `input` - Packets destined for the router itself
 * - `forward` - Packets passing through the router
 * - `output` - Packets originating from the router
 * - `prerouting` - Packets before routing decision (NAT source)
 * - `postrouting` - Packets after routing decision (NAT destination)
 */
export type FirewallChain = 'input' | 'forward' | 'output' | 'prerouting' | 'postrouting';

/**
 * Firewall rule actions
 *
 * @remarks
 * Actions to take when a packet matches a firewall rule:
 * - `accept` - Allow the packet to pass
 * - `drop` - Silently discard the packet
 * - `reject` - Discard and send error response
 * - `log` - Log the packet without accepting/dropping
 */
export type FirewallAction = 'accept' | 'drop' | 'reject' | 'log';

/**
 * Network protocols for firewall rules
 *
 * @remarks
 * Protocols that can be matched in firewall rules:
 * - `tcp` - Transmission Control Protocol
 * - `udp` - User Datagram Protocol
 * - `icmp` - Internet Control Message Protocol (IPv4)
 * - `ipv6-icmp` - ICMPv6 protocol
 * - `all` - Any protocol
 */
export type FirewallProtocol = 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all';

/**
 * Firewall filter rule configuration
 *
 * @remarks
 * Represents a rule in the RouterOS firewall filter table.
 * Rules are evaluated in order and the first matching rule determines the action.
 */
export interface FirewallRule {
  /** Unique identifier for the rule */
  readonly id: string;

  /** Whether the rule is disabled */
  disabled: boolean;

  /** Firewall chain this rule applies to */
  chain: FirewallChain;

  /** Action to take when packet matches */
  action: FirewallAction;

  /** Optional comment/description */
  comment?: string;

  /** Protocol to match (tcp, udp, icmp, etc.) */
  protocol?: FirewallProtocol;

  /** Source IP address or CIDR range */
  srcAddress?: string;

  /** Destination IP address or CIDR range */
  dstAddress?: string;

  /** Source port or port range */
  srcPort?: string;

  /** Destination port or port range */
  dstPort?: string;

  /** Input interface name */
  inInterface?: string;

  /** Output interface name */
  outInterface?: string;

  /** Source address list name */
  srcAddressList?: string;

  /** Destination address list name */
  dstAddressList?: string;

  /** Connection states to match */
  connectionState?: readonly string[];

  /** Whether to log matching packets */
  log?: boolean;

  /** Prefix for logged packets */
  logPrefix?: string;

  /** Number of packets matched by this rule (read-only) */
  readonly packets?: number;

  /** Number of bytes matched by this rule (read-only) */
  readonly bytes?: number;

  /** Input interface list name */
  inInterfaceList?: string;

  /** Output interface list name */
  outInterfaceList?: string;

  /** Rule priority order */
  order: number;
}

/**
 * Network Address Translation (NAT) rule configuration
 *
 * @remarks
 * Represents a NAT rule in the RouterOS firewall NAT table.
 * NAT rules modify source or destination addresses/ports in packet flows.
 */
export interface NATRule {
  /** Unique identifier for the rule */
  readonly id: string;

  /** Whether the rule is disabled */
  disabled: boolean;

  /** NAT chain (prerouting for DNAT, postrouting for SNAT) */
  chain: Exclude<FirewallChain, 'input' | 'forward' | 'output'>;

  /** NAT action type */
  action: 'src-nat' | 'dst-nat' | 'masquerade' | 'redirect';

  /** Optional comment/description */
  comment?: string;

  /** Protocol to match */
  protocol?: FirewallProtocol;

  /** Source IP address or CIDR range */
  srcAddress?: string;

  /** Destination IP address or CIDR range */
  dstAddress?: string;

  /** Source port or port range */
  srcPort?: string;

  /** Destination port or port range */
  dstPort?: string;

  /** Input interface name */
  inInterface?: string;

  /** Output interface name */
  outInterface?: string;

  /** Addresses to translate to (for SNAT/DNAT) */
  toAddresses?: string;

  /** Ports to translate to */
  toPorts?: string;

  /** Rule priority order */
  order: number;
}

/**
 * Mangle rule configuration for packet marking
 *
 * @remarks
 * Represents a rule in the RouterOS firewall mangle table.
 * Mangle rules mark packets/connections for QoS and policy routing.
 */
export interface MangleRule {
  /** Unique identifier for the rule */
  readonly id: string;

  /** Whether the rule is disabled */
  disabled: boolean;

  /** Firewall chain this rule applies to */
  chain: FirewallChain;

  /** Mangle action type */
  action: 'mark-connection' | 'mark-packet' | 'set-priority' | 'set-dscp';

  /** Optional comment/description */
  comment?: string;

  /** Protocol to match */
  protocol?: FirewallProtocol;

  /** Source IP address or CIDR range */
  srcAddress?: string;

  /** Destination IP address or CIDR range */
  dstAddress?: string;

  /** Source port or port range */
  srcPort?: string;

  /** Destination port or port range */
  dstPort?: string;

  /** Mark to apply to connection */
  newMark?: string;

  /** Priority level (0-7) */
  newPriority?: string;

  /** DSCP value for QoS */
  newDscp?: string;

  /** Rule priority order */
  order: number;
}

/**
 * Routing table entry
 *
 * @remarks
 * Represents a single route in the RouterOS routing table.
 * Routes determine how packets are forwarded to their destinations.
 */
export interface RouteEntry {
  /** Unique identifier for the route */
  readonly id: string;

  /** Whether the route is disabled */
  disabled: boolean;

  /** Destination network in CIDR format (e.g., "192.168.1.0/24") */
  destination: string;

  /** Gateway IP address for this route */
  gateway?: string;

  /** Interface to use for this route */
  interface?: string;

  /** Route priority (lower distance = higher priority) */
  distance: number;

  /** Type of route (unicast, blackhole, unreachable, prohibit) */
  routeType: 'unicast' | 'blackhole' | 'unreachable' | 'prohibit';

  /** Whether this is a dynamically learned route */
  dynamic: boolean;

  /** Whether this route is currently active */
  active: boolean;
}

/**
 * Routing table
 *
 * @remarks
 * Container for all active routes in the RouterOS routing table.
 */
export interface RoutingTable {
  /** Array of route entries */
  readonly routes: readonly RouteEntry[];
}

/**
 * Firewall address list entry
 *
 * @remarks
 * Represents a single entry in an address list for use in firewall rules.
 * Address lists group multiple IPs/networks for convenient rule management.
 */
export interface AddressList {
  /** Unique identifier for the entry */
  readonly id: string;

  /** Address list name this entry belongs to */
  name: string;

  /** IP address or network in CIDR format (e.g., "192.168.1.100/32") */
  address: string;

  /** Optional comment/description */
  comment?: string;

  /** Whether this entry is disabled */
  disabled: boolean;
}

/**
 * Router service configuration (API, SSH, Winbox, WWW, etc.)
 *
 * @remarks
 * Represents a service listening on the router (e.g., SSH, API, Winbox).
 * Endpoint: GET /rest/ip/service
 */
export interface RouterService {
  /** Unique identifier for the service */
  readonly id: string;

  /** Service name (api, api-ssl, ftp, ssh, telnet, winbox, www, www-ssl) */
  name: string;

  /** TCP/UDP port the service listens on */
  port: number;

  /** Whether the service is disabled */
  disabled: boolean;

  /** IP address restriction (if set, only requests from this address are allowed) */
  address?: string;

  /** SSL certificate name (for SSL-enabled services) */
  certificate?: string;
}

/**
 * Filter options for firewall rule search
 *
 * @remarks
 * Used for filtering firewall rules in list/search views.
 */
export interface FirewallFilters {
  /** Text search across rule comments and fields */
  search?: string;

  /** Filter by firewall chain */
  chain?: FirewallChain | 'all';

  /** Filter by rule action */
  action?: FirewallAction | 'all';

  /** Filter by protocol */
  protocol?: FirewallProtocol | 'all';

  /** Filter by rule enabled/disabled status */
  status?: 'enabled' | 'disabled' | 'all';
}

/**
 * Chain summary statistics
 *
 * @remarks
 * Aggregated statistics for rules in a specific firewall chain.
 */
export interface ChainSummary {
  /** The firewall chain */
  chain: FirewallChain;

  /** Total number of rules in the chain */
  totalRules: number;

  /** Number of accept rules */
  acceptCount: number;

  /** Number of drop rules */
  dropCount: number;

  /** Number of reject rules */
  rejectCount: number;

  /** Number of rules with logging enabled */
  logCount: number;

  /** Number of disabled rules */
  disabledCount: number;
}

/**
 * Connection tracking state for active connections
 *
 * @remarks
 * More detailed than simple ConnectionState (which is used for mangle rule matching).
 * Includes TCP-specific states for the connection tracking table.
 * These represent detailed states of established connections.
 */
export type ConnectionTrackingState =
  | 'established'   // Connection fully established
  | 'new'           // New connection
  | 'related'       // Related to established connection
  | 'invalid'       // Invalid/untracked
  | 'time-wait'     // TCP TIME_WAIT state
  | 'syn-sent'      // TCP SYN_SENT state
  | 'syn-received'  // TCP SYN_RECEIVED state
  | 'fin-wait'      // TCP FIN_WAIT state
  | 'close-wait'    // TCP CLOSE_WAIT state
  | 'last-ack'      // TCP LAST_ACK state
  | 'close';        // TCP CLOSE state

/**
 * Active connection entry from connection tracking table
 *
 * @remarks
 * Represents a single tracked connection in the router's connection table.
 * Endpoint: GET /rest/ip/firewall/connection
 */
export interface Connection {
  /** Unique identifier for the connection entry */
  readonly id: string;

  /** Protocol type (tcp, udp, icmp, gre, etc.) */
  protocol: 'tcp' | 'udp' | 'icmp' | 'gre' | string;

  /** Source IP address */
  srcAddress: string;

  /** Source port (if applicable) */
  srcPort?: number;

  /** Destination IP address */
  dstAddress: string;

  /** Destination port (if applicable) */
  dstPort?: number;

  /** Reply destination address (for NAT connections) */
  replyDstAddress?: string;

  /** Reply destination port (for NAT connections) */
  replyDstPort?: number;

  /** Current connection tracking state */
  state: ConnectionTrackingState;

  /** Time until connection entry expires (e.g., "23h59m59s") */
  timeout: string;

  /** Number of packets in this connection */
  packets: number;

  /** Number of bytes transferred in this connection */
  bytes: number;

  /** Whether connection is assured (NAT helper confirmed) */
  assured?: boolean;

  /** Whether connection has been confirmed by both directions */
  confirmed?: boolean;
}

/**
 * Connection tracking settings
 *
 * @remarks
 * Configuration for the router's connection tracking subsystem.
 * Endpoint: GET /rest/ip/firewall/connection/tracking
 */
export interface ConnectionTrackingSettings {
  /** Whether connection tracking is enabled */
  enabled: boolean;

  /** Maximum number of connection entries allowed */
  maxEntries: number;

  /** Generic timeout for connections (seconds) */
  genericTimeout: number;

  /** Timeout for established TCP connections (seconds) */
  tcpEstablishedTimeout: number;

  /** Timeout for TCP TIME_WAIT state (seconds) */
  tcpTimeWaitTimeout: number;

  /** Timeout for TCP CLOSE state (seconds) */
  tcpCloseTimeout: number;

  /** Timeout for TCP SYN_SENT state (seconds) */
  tcpSynSentTimeout: number;

  /** Timeout for TCP SYN_RECEIVED state (seconds) */
  tcpSynReceivedTimeout: number;

  /** Timeout for TCP FIN_WAIT state (seconds) */
  tcpFinWaitTimeout: number;

  /** Timeout for TCP CLOSE_WAIT state (seconds) */
  tcpCloseWaitTimeout: number;

  /** Timeout for TCP LAST_ACK state (seconds) */
  tcpLastAckTimeout: number;

  /** Timeout for UDP connections (seconds) */
  udpTimeout: number;

  /** Timeout for UDP streams (seconds) */
  udpStreamTimeout: number;

  /** Timeout for ICMP (seconds) */
  icmpTimeout: number;

  /** Whether loose tracking is enabled */
  looseTracking: boolean;
}

/**
 * Filter options for connection search
 *
 * @remarks
 * Used for filtering active connections in the connection tracking table.
 */
export interface ConnectionFilters {
  /** IP address to search (supports wildcards like 192.168.1.*) */
  ipAddress?: string;

  /** Port number to filter by */
  port?: number;

  /** Protocol to filter by (tcp, udp, icmp, etc.) */
  protocol?: string;

  /** Connection state to filter by */
  state?: ConnectionTrackingState;
}
